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
import org.slf4j.LoggerFactory
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

    // The history of chat
    var history: String = ""

    @Transient
    var driver: DriverConnection? = null
        private set
    @Transient
    val navigators = HashMap<Int, NavigatorConnection>()

    @Transient
    val log = LoggerFactory.getLogger(this.javaClass)!!

    @Synchronized
    fun addNavigator(conn: NavigatorConnection) {
        navigators[conn.id] = conn
    }

    @Synchronized
    suspend fun setDriver(conn: DriverConnection?) {
        disconnectDriver(driver)

        log.debug("[$id] connecting driver: $conn")
        driver = conn

        // Notify already-connected navigators that they can now attempt WebRTC connection
        log.debug("[$id] notifying navigators connection of driver: $conn")
        navigators.values.forEach { nav -> if (!nav.dead) nav.notifyDriverReady() }
        pruneDeadNavigators()
    }

    // Yucks
    @Synchronized
    suspend fun disconnectDriver(current: DriverConnection?) {
        log.debug("[$id] disconnecting driver: $current")
        if (driver != current || current == null)
            return
        log.debug("[$id] disconnecting WebSocket with driver: $current")
        current.disconnect()
        driver = null
        log.debug("[$id] notifying navigators disconnection of driver: $current")
        navigators.values.forEach { nav -> if (!nav.dead) nav.notifyDriverQuit() }
    }

    @Synchronized
    private fun pruneDeadNavigators() {
        ArrayList(navigators.values).forEach {
            if (it.dead)
                navigators.remove(it.id)
        }
    }
}

abstract class BaseConnection(val session: Session, protected val wsSession: WebSocketServerSession) {
    val id = idBase++
    var dead = false
        private set

    protected fun markAsDead() {
        dead = true
    }

    protected suspend fun sendMessage(m: WebSocketMessage) {
        if (dead)
            session.log.info("[BUG] sendMessage called on a dead connection: ${Exception().stackTrace}")
        val s = m.toJson()
        try {
            wsSession.send(s)
        } catch (e: Exception) {
            session.log.debug("[${session.id}] dead connection detected during sendMessage: $this")
            markAsDead()
        }
    }

    suspend fun disconnect() {
        wsSession.close()
    }

    companion object {
        private var idBase = 0
    }
}

class DriverConnection(session: Session, wsSession: WebSocketServerSession) : BaseConnection(session, wsSession) {
    suspend fun requestSdpOffer(navConn: NavigatorConnection, message: WebSocketMessage) {
        sendMessage(WebSocketMessage("request_sdp", message.payload, navConn.id))
    }

    suspend fun receiveNavigatorSdp(navConn: NavigatorConnection, message: WebSocketMessage, remoteId: Int) {
        sendMessage(WebSocketMessage("navigator_sdp", message.payload, navConn.id, remoteId))
    }

    suspend fun answerNavigatorSdp(navConn: NavigatorConnection, message: WebSocketMessage, remoteId: Int) {
        sendMessage(WebSocketMessage("navigator_answer", message.payload, navConn.id, remoteId))
    }

    suspend fun navigatorIce(navConn: NavigatorConnection, message: WebSocketMessage, remoteId: Int) {
        sendMessage(WebSocketMessage("navigator_ice", message.payload, navConn.id, remoteId))
    }

    suspend fun receiveSdpAnswer(navConn: NavigatorConnection, message: WebSocketMessage) {
        sendMessage(WebSocketMessage("sdp", message.payload, navConn.id))
    }

    suspend fun receiveIceCandidate(navConn: NavigatorConnection, message: WebSocketMessage) {
        sendMessage(WebSocketMessage("ice_candidate", message.payload, navConn.id))
    }


    suspend fun sendChatMessage(navConn: NavigatorConnection, message: WebSocketMessage) {
        sendMessage(WebSocketMessage("chat", message.payload, navConn.id))
    }

    suspend fun driverChatMessage(message: WebSocketMessage) {
        sendMessage(WebSocketMessage("chat", message.payload))
    }
}

class NavigatorConnection(session: Session, wsSession: WebSocketServerSession) : BaseConnection(session, wsSession) {
    suspend fun requestSdpOffer(message: WebSocketMessage, navigator_id: Int, remoteId: Int) {
        sendMessage(WebSocketMessage("navigator_request_sdp", message.payload, navigator_id, remoteId))
    }

    suspend fun receiveNavigatorSdp(message: WebSocketMessage, navigator_id: Int, remoteId: Int) {
        sendMessage(WebSocketMessage("navigator_sdp", message.payload, navigator_id, remoteId))
    }

    suspend fun answerNavigatorSdp(message: WebSocketMessage, navigator_id: Int, remoteId: Int) {
        sendMessage(WebSocketMessage("navigator_answer", message.payload, navigator_id, remoteId))
    }

    suspend fun navigatorIce(message: WebSocketMessage, navigator_id: Int, remoteId: Int) {
        sendMessage(WebSocketMessage("navigator_ice", message.payload, navigator_id, remoteId))
    }

    suspend fun receiveSdpOffer(message: WebSocketMessage, navigator_id: Int) {
        sendMessage(WebSocketMessage("sdp", message.payload, navigator_id))
    }

    suspend fun receiveIceCandidate(message: WebSocketMessage, navigator_id: Int) {
        sendMessage(WebSocketMessage("ice_candidate", message.payload, navigator_id))
    }

    suspend fun notifyDriverReady() {
        sendMessage(WebSocketMessage("driver_ready", ""))
    }

    suspend fun notifyDriverQuit() {
        sendMessage(WebSocketMessage("driver_quit", ""))
    }
}

// FIXME: navigator_id smells bad
@Serializable
data class WebSocketMessage(val kind: String, val payload: String, val navigator_id: Int = -1, val remoteId: Int = -1) {
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
                log.debug("[${sess.id}] connecting navigator: $conn")
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
                            if (driver == null)
                                log.debug("[${sess.id}] ignoring request_sdp from nav-${conn.id}")
                            driver?.requestSdpOffer(conn, msg)
                        }
                        "navigator_sdp" -> {
                            val driver = sess.driver
                            val remoteId = msg.remoteId;
                            if (driver == null)
                                log.debug("[${sess.id}] ignoring sdp from nav-${conn.id}")
                            driver?.receiveNavigatorSdp(conn, msg, remoteId)
                        }
                        "navigator_answer" -> {
                            val driver = sess.driver
                            val remoteId = msg.remoteId;
                            if (driver == null)
                                log.debug("[${sess.id}] ignoring sdp from nav-${conn.id}")
                            driver?.answerNavigatorSdp(conn, msg, remoteId)
                        }

                        "navigator_ice" -> {
                            val driver = sess.driver
                            val remoteId = msg.remoteId;
                            if (driver == null)
                                log.debug("[${sess.id}] ignoring sdp from nav-${conn.id}")
                            driver?.navigatorIce(conn, msg, remoteId)
                        }
                        "sdp" -> {
                            val driver = sess.driver
                            if (driver == null)
                                log.debug("[${sess.id}] ignoring sdp from nav-${conn.id}")
                            driver?.receiveSdpAnswer(conn, msg)
                        }
                        "ice_candidate" -> {
                            val driver = sess.driver
                            if (driver == null)
                                log.debug("[${sess.id}] ignoring ice_candidate from nav-${conn.id}")
                            driver?.receiveIceCandidate(conn, msg)
                        }
                        "chat" -> {
                            val driver = sess.driver
                            if (driver == null)
                                log.debug("[${sess.id}] ignoring chat from nav-${conn.id}")
                            driver?.sendChatMessage(conn, msg)
                        }
                        else -> {
                            log.info("[${sess.id}] invalid websocket message ${msg.kind} from nav-${conn.id}")
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
                log.debug("[${sess.id}] connecting driver: $conn")
                sess.setDriver(conn)

                try {
                    for (frame in incoming) {
                        if (frame !is Frame.Text) {
                            close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "FIXME: invalid frame"))
                            continue
                        }
                        val msg = WebSocketMessage.parseJson(frame.readText())
                        when (msg.kind) {
                            "navigator_request_sdp" -> {
                                val navConn = sess.navigators[msg.navigator_id]
                                if (navConn == null)
                                    log.debug("[${sess.id}] ignoring request sdp to nav-${msg.navigator_id}")
                                navConn?.requestSdpOffer(msg, msg.navigator_id, msg.remoteId)
                            }
                            "navigator_sdp" -> {
                                val navConn = sess.navigators[msg.navigator_id]
                                if (navConn == null)
                                    log.debug("[${sess.id}] ignoring request sdp to nav-${msg.navigator_id}")
                                navConn?.receiveNavigatorSdp(msg, msg.navigator_id, msg.remoteId)
                            }
                            "navigator_answer" -> {
                                val navConn = sess.navigators[msg.navigator_id]
                                if (navConn == null)
                                    log.debug("[${sess.id}] ignoring request sdp to nav-${msg.navigator_id}")
                                navConn?.answerNavigatorSdp(msg, msg.navigator_id, msg.remoteId)
                            }
                            "navigator_ice" -> {
                                val navConn = sess.navigators[msg.navigator_id]
                                if (navConn == null)
                                    log.debug("[${sess.id}] ignoring request sdp to nav-${msg.navigator_id}")
                                navConn?.navigatorIce(msg, msg.navigator_id, msg.remoteId)
                            }
                            "sdp" -> {
                                val navConn = sess.navigators[msg.navigator_id]
                                if (navConn == null)
                                    log.debug("[${sess.id}] ignoring sdp to nav-${msg.navigator_id}")
                                log.debug("${msg.navigator_id}")
                                log.debug(msg.payload)

                                navConn?.receiveSdpOffer(msg, msg.navigator_id)
                            }
                            "ice_candidate" -> {
                                val navConn = sess.navigators[msg.navigator_id]
                                if (navConn == null)
                                    log.debug("[${sess.id}] ignoring ice_candidate to nav-${msg.navigator_id}")
                                log.debug("${msg.navigator_id}")
                                log.debug(msg.payload)
                                navConn?.receiveIceCandidate(msg, msg.navigator_id)
                            }
                            "quit" -> {
                                log.info("driver: quitting")
                                close()
                                return@webSocket
                            }
                            "driver_quit" -> {
                                sess.config.state = "No Connection"
                            }
                            "chat_history" -> {
                                sess.history += msg.payload
                            }
                            "chat" -> {
                                val driver = sess.driver
                                driver?.driverChatMessage(msg)
                            }
                            else -> {
                                log.info("invalid websocket message from driver: " + msg.kind)
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
