package club.itsp.elang.agmob.workspace

import io.ktor.application.call
import io.ktor.application.install
import io.ktor.application.log
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.cio.websocket.*
import io.ktor.http.content.default
import io.ktor.http.content.files
import io.ktor.http.content.static
import io.ktor.http.content.staticRootFolder
import io.ktor.response.respondText
import io.ktor.routing.post
import io.ktor.routing.routing
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.websocket.WebSocketServerSession
import io.ktor.websocket.WebSockets
import io.ktor.websocket.webSocket
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.File
import java.util.*
import kotlin.collections.HashMap

class Session {
    val id = UUID.randomUUID().toString()
    val driver = DriverConnection(this)
    val navigators = HashMap<Int, NavigatorConnection>()

    fun addNavigator(wss: WebSocketServerSession): NavigatorConnection {
        val conn = NavigatorConnection(this)
        conn.wsSession = wss
        navigators[conn.id] = conn
        return conn
    }

    fun setDriverWebSocketSession(wss: WebSocketServerSession) {
        driver.wsSession = wss
    }
}

class DriverConnection(val session: Session) {
    var wsSession: WebSocketServerSession? = null

    suspend fun requestSdp(navConn: NavigatorConnection, message: WebSocketMessage) {
        wsSession?.send(WebSocketMessage("request_sdp", message.payload, navConn.id).toJson())
    }

    suspend fun receiveAnswerSdp(navConn: NavigatorConnection, message: WebSocketMessage) {
        wsSession?.send(WebSocketMessage("sdp", message.payload, navConn.id).toJson())
    }
}

class NavigatorConnection(val session: Session) {
    val id = idBase++
    var wsSession: WebSocketServerSession? = null

    suspend fun receiveOfferSdp(message: WebSocketMessage) {
        wsSession?.send(WebSocketMessage("sdp", message.payload).toJson())
    }

    companion object {
        private var idBase = 0
    }
}

// FIXME: navigator_id smells bad
@Serializable
data class WebSocketMessage(val kind: String, val payload: String, val navigator_id: Int = -1){
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
                val sess = Session()
                sessions[sess.id] = sess
                call.respondText("{\"id\":\"${sess.id}\"}", ContentType.Application.Json)
            }

            // FIXME: This will be removed
            webSocket("/api/session/{id}/echo") {
                val sess = sessions[call.parameters["id"]]
                if (sess == null) {
                    call.respondText("FIXME: invalid sess id", status = HttpStatusCode.BadRequest)
                    return@webSocket
                }

                for (frame in incoming) {
                    if (frame !is Frame.Text) {
                        close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "FIXME: invalid frame"))
                        continue
                    }
                    outgoing.send(frame)
                }
            }

            webSocket("/api/session/{id}/navigator") {
                val sess = sessions[call.parameters["id"]]
                if (sess == null) {
                    call.respondText("FIXME: invalid sess id", status = HttpStatusCode.BadRequest)
                    return@webSocket
                }
                val conn = sess.addNavigator(this)

                for (frame in incoming) {
                    if (frame !is Frame.Text) {
                        close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "FIXME: invalid frame"))
                        continue
                    }
                    val msg = WebSocketMessage.parseJson(frame.readText())
                    when (msg.kind) {
                        "request_sdp" -> sess.driver.requestSdp(conn, msg)
                        "sdp" -> sess.driver.receiveAnswerSdp(conn, msg)
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
                sess.setDriverWebSocketSession(this)

                for (frame in incoming) {
                    if (frame !is Frame.Text) {
                        close(CloseReason(CloseReason.Codes.CANNOT_ACCEPT, "FIXME: invalid frame"))
                        continue
                    }
                    val msg = WebSocketMessage.parseJson(frame.readText())
                    when (msg.kind) {
                        "sdp" -> {
                            val navConn = sess.navigators[msg.navigator_id]
                            navConn?.receiveOfferSdp(msg)
                        }
                        else -> {
                            log.info("invalid websocket message from navigator")
                        }
                    }
                }
            }

            static {
                staticRootFolder = File("../navigator")
                files("./")
                default("index.html")
            }
        }
    }.start(wait = true)
}
