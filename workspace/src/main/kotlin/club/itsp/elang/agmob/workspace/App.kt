package club.itsp.elang.agmob.workspace

import io.ktor.application.call
import io.ktor.http.ContentType
import io.ktor.http.content.default
import io.ktor.http.content.static
import io.ktor.http.content.staticRootFolder
import io.ktor.response.respondText
import io.ktor.routing.post
import io.ktor.routing.routing
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import java.io.File
import java.util.*

class App {
    val greeting: String
        get() {
            return "Hello world."
        }
}

class Session {
    val id = UUID.randomUUID().toString()
}

fun main(args: Array<String>) {
    println(App().greeting)

    val sessions = HashMap<String, Session>()

    embeddedServer(Netty, 8080) {
        routing {
            post("/api/session") {
                val sess = Session()
                sessions[sess.id] = sess
                call.respondText("{\"id\":\"${sess.id}\"}", ContentType.Application.Json)
            }
        }
        routing {
            static("navigator"){
                staticRootFolder = File("../navigator")
                default("index.html")
            }
        }
    }.start(wait = true)
}
