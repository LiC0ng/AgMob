package club.itsp.elang.agmob.workspace

import io.ktor.application.call
import io.ktor.application.install
import io.ktor.application.log
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.cio.websocket.*
import io.ktor.request.receiveText
import io.ktor.response.respondText
import io.ktor.routing.get
import io.ktor.routing.post
import io.ktor.routing.put
import io.ktor.routing.routing
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.websocket.WebSocketServerSession
import io.ktor.websocket.WebSockets
import io.ktor.websocket.webSocket
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import kotlinx.serialization.json.Json
import java.util.*
import kotlin.collections.HashMap

@Serializable
class SessionConfiguration(
        // The length of a 'mob session' in seconds
        var interval: Int,
        // The unix time stamp in seconds (JavaScript: Date.now() / 1000)
        var begin: Long,
        // The mode of a 'mob session'
        var mode: String = "Free Mode",
        // The state of a mob 'session'
        var state: String = "No Connection"
)

@Serializable
class Session(var config: SessionConfiguration) {
    val id = UUID.randomUUID().toString()
    @Transient
    var driver: DriverConnection? = null
        private set
    @Transient
    val navigators = HashMap<Int, NavigatorConnection>()

    fun addNavigator(conn: NavigatorConnection) {
        navigators[conn.id] = conn
    }

    @Synchronized
    suspend fun setDriver(conn: DriverConnection?) {
        disconnectDriver(driver)
        driver = conn

        // Notify already-connected navigators that they can now attempt WebRTC connection
        navigators.values.forEach { nav -> nav.notifyDriverReady() }
    }

    // Yucks
    @Synchronized
    suspend fun disconnectDriver(current: DriverConnection?) {
        if (driver != current || current == null)
            return
        current.disconnect()
        driver = null
        navigators.values.forEach { nav -> nav.notifyDriverQuit() }
    }
}

abstract class BaseConnection(val session: Session) {
    val id = idBase++

    companion object {
        private var idBase = 0
    }
}

class DriverConnection(session: Session, private val wsSession: WebSocketServerSession) : BaseConnection(session) {
    suspend fun requestSdpOffer(navConn: NavigatorConnection, message: WebSocketMessage) {
        wsSession.send(WebSocketMessage("request_sdp", message.payload, navConn.id).toJson())
    }

    suspend fun receiveSdpAnswer(navConn: NavigatorConnection, message: WebSocketMessage) {
        wsSession.send(WebSocketMessage("sdp", message.payload, navConn.id).toJson())
    }

    suspend fun receiveIceCandidate(navConn: NavigatorConnection, message: WebSocketMessage) {
        wsSession.send(WebSocketMessage("ice_candidate", message.payload, navConn.id).toJson())
    }

    suspend fun sendChatMessage(navConn: NavigatorConnection, message: WebSocketMessage) {
        wsSession.send(WebSocketMessage("chat", message.payload, navConn.id).toJson())
    }

    suspend fun driverChatMessage(message: WebSocketMessage) {
        wsSession.send(WebSocketMessage("chat", message.payload).toJson())
    }


    suspend fun disconnect() {
        wsSession.close()
    }
}

class NavigatorConnection(session: Session, private val wsSession: WebSocketServerSession) : BaseConnection(session) {
    suspend fun receiveSdpOffer(message: WebSocketMessage) {
        wsSession.send(WebSocketMessage("sdp", message.payload).toJson())
    }

    suspend fun receiveIceCandidate(message: WebSocketMessage) {
        wsSession.send(WebSocketMessage("ice_candidate", message.payload).toJson())
    }

    suspend fun notifyDriverReady() {
        wsSession.send(WebSocketMessage("driver_ready", "").toJson())
    }

    suspend fun notifyDriverQuit() {
        wsSession.send(WebSocketMessage("driver_quit", "").toJson())
    }
}

// FIXME: navigator_id smells bad
@Serializable
data class WebSocketMessage(val kind: String, val payload: String, val navigator_id: Int = -1) {
    fun toJson(): String = Json.stringify(serializer(), this)

    companion object {
        fun parseJson(data: String) = Json.parse(serializer(), data)
    }
}

fun main(args: Array<String>) {
    val sessions = HashMap<String, Session>()

    embeddedServer(Netty, 8080) {
        install(WebSockets)

        routing {
            post("/api/session") {
                val configText = call.receiveText()
                // FIXME: Once driver supports it, this 'if' must be removed
                val sess = Session(if (configText.isNotBlank())
                    Json.parse(SessionConfiguration.serializer(), configText)
                else
                    SessionConfiguration(10 * 60, System.currentTimeMillis() / 1000L))
                sessions[sess.id] = sess
                call.respondText(Json.stringify(Session.serializer(), sess), ContentType.Application.Json)
            }

            put("/api/session/{id}") {
                val sess = sessions[call.parameters["id"]]
                if (sess == null) {
                    call.respondText("FIXME: invalid sess id", status = HttpStatusCode.BadRequest)
                    return@put
                }
                val newConfig = Json.parse(SessionConfiguration.serializer(), call.receiveText())
                sess.config = newConfig
                call.respondText(Json.stringify(Session.serializer(), sess), ContentType.Application.Json)
            }

            get("/api/session/{id}") {
                val sess = sessions[call.parameters["id"]]
                if (sess == null) {
                    call.respondText("FIXME: invalid sess id", status = HttpStatusCode.BadRequest)
                    return@get
                }
                call.respondText(Json.stringify(Session.serializer(), sess), ContentType.Application.Json)
            }

            webSocket("/api/session/{id}/navigator") {
                val sess = sessions[call.parameters["id"]]
                if (sess == null) {
                    call.respondText("FIXME: invalid sess id", status = HttpStatusCode.BadRequest)
                    return@webSocket
                }
                val conn = NavigatorConnection(sess, this)
                sess.addNavigator(conn)

                for (frame in incoming) {
                    if (frame !is Frame.Text) {
                        close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "FIXME: invalid frame"))
                        continue
                    }
                    val msg = WebSocketMessage.parseJson(frame.readText())
                    when (msg.kind) {
                        "request_sdp" -> {
                            val driver = sess.driver
                            driver?.requestSdpOffer(conn, msg)
                        }
                        "sdp" -> {
                            val driver = sess.driver
                            driver?.receiveSdpAnswer(conn, msg)
                        }
                        "ice_candidate" -> {
                            val driver = sess.driver
                            driver?.receiveIceCandidate(conn, msg)
                        }
                        "chat" -> {
                            val driver = sess.driver
                            driver?.sendChatMessage(conn, msg)
                        }
                        else -> {
                            log.info("invalid websocket message from navigator")
                        }
                    }
                }
            }

            webSocket("/api/session/{id}/driver") {
                val sess = sessions[call.parameters["id"]]
                if (sess == null) {
                    call.respondText("FIXME: invalid sess id", status = HttpStatusCode.BadRequest)
                    return@webSocket
                }
                val conn = DriverConnection(sess, this)
                sess.setDriver(conn)

                try {
                    for (frame in incoming) {
                        if (frame !is Frame.Text) {
                            close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "FIXME: invalid frame"))
                            continue
                        }
                        val msg = WebSocketMessage.parseJson(frame.readText())
                        when (msg.kind) {
                            "sdp" -> {
                                val navConn = sess.navigators[msg.navigator_id]
                                navConn?.receiveSdpOffer(msg)
                            }
                            "ice_candidate" -> {
                                val navConn = sess.navigators[msg.navigator_id]
                                navConn?.receiveIceCandidate(msg)
                            }
                            "quit" -> {
                                log.info("driver: quitting")
                                close()
                                return@webSocket
                            }
                            "driver_quit" -> {
                                sess.config.state = "No Connection"
                            }
                            "chat" -> {
                                val driver = sess.driver
                                driver?.driverChatMessage(msg)
                            }
                            else -> {
                                log.info("invalid websocket message from navigator")
                            }
                        }
                    }
                } finally {
                    sess.disconnectDriver(conn)
                }
            }
        }
    }.start(wait = true)
}
