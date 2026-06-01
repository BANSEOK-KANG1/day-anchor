package com.dayanchor.widget

import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Reference client for GET /api/widget/today?token=...
 * Set apiUrl in res/values/strings.xml (widget_api_url).
 */
object WidgetApiClient {
    data class Line(val time: String, val title: String)

    fun fetchLines(apiUrl: String): List<Line> {
        val connection = URL(apiUrl).openConnection() as HttpURLConnection
        connection.requestMethod = "GET"
        connection.connectTimeout = 8000
        connection.readTimeout = 8000
        return try {
            if (connection.responseCode != 200) return emptyList()
            val body = connection.inputStream.bufferedReader().readText()
            parse(body)
        } finally {
            connection.disconnect()
        }
    }

    private fun parse(json: String): List<Line> {
        val root = JSONObject(json)
        val blocks = root.optJSONArray("blocks") ?: JSONArray()
        val lines = mutableListOf<Line>()
        for (i in 0 until minOf(blocks.length(), 3)) {
            val block = blocks.getJSONObject(i)
            val start = block.optString("start")
            val end = block.optString("end")
            val title = block.optString("title")
            lines.add(Line("$start–$end", title))
        }
        return lines
    }
}
