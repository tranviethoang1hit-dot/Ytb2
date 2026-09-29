package com.example.ytmusicplayer.data.repository

import com.example.ytmusicplayer.BuildConfig
import com.example.ytmusicplayer.data.model.Category
import com.example.ytmusicplayer.data.model.VideoItem
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.regex.Pattern

class YouTubeRepository {
    val categories = listOf(
        Category("trending", "Thịnh hành", "Flame", "nhạc việt thịnh hành trending hot nhất"),
        Category("vpop", "Nhạc Trẻ Hot", "Music2", "v-pop hits mới nhất tuyển chọn"),
        Category("lofi", "Lofi Chill", "Moon", "lofi chill vn không lời ngủ ngon thư giãn"),
        Category("acoustic", "Acoustic", "Guitar", "acoustic việt nhẹ nhàng thư giãn"),
        Category("remix", "Remix & EDM", "Zap", "nhạc trẻ remix bass cực căng vinahouse"),
        Category("usuk", "US-UK Billboard", "Globe", "billboard top 100 hot hits"),
        Category("kpop", "K-Pop Mới", "Sparkles", "kpop new releases hits trending"),
        Category("podcast", "Podcast", "Mic", "podcast vietcetera have a sip"),
        Category("study", "Tập Trung", "BookOpen", "study music ambient focus work")
    )

    /** Offline-safe fallback data. API search is used when YOUTUBE_API_KEY is configured. */
    val curatedVideos: Map<String, List<VideoItem>> = mapOf(
        "trending" to listOf(
            VideoItem("abPmZCZZrFA", "SƠN TÙNG M-TP | ĐỪNG LÀM TRÁI TIM ANH ĐAU", "Sơn Tùng M-TP Official", "https://i.ytimg.com/vi/abPmZCZZrFA/hqdefault.jpg", "5:24", "120M views", "2024"),
            VideoItem("4iFP_wd6quo", "SƠN TÙNG M-TP | CHÚNG TA CỦA TƯƠNG LAI", "Sơn Tùng M-TP Official", "https://i.ytimg.com/vi/4iFP_wd6quo/hqdefault.jpg", "4:15", "85M views", "2024"),
            VideoItem("F5tS548P45k", "Vũ. - Lạ Lùng (Official Audio)", "Vũ. Official", "https://i.ytimg.com/vi/F5tS548P45k/hqdefault.jpg", "4:21", "110M views", "2023"),
            VideoItem("UVbv-PJXm14", "Đen - Mang Tiền Về Cho Mẹ ft. Nguyên Thảo", "Đen Vâu Official", "https://i.ytimg.com/vi/UVbv-PJXm14/hqdefault.jpg", "6:02", "98M views", "2023"),
            VideoItem("hW6BhyuCsmE", "CẮT ĐÔI NỖI SẦU | TĂNG DUY TÂN", "Tăng Duy Tân Official", "https://i.ytimg.com/vi/hW6BhyuCsmE/hqdefault.jpg", "3:15", "74M views", "2023"),
            VideoItem("gJHSDZfJrRY", "Hoàng Thùy Linh - See Tình (Official MV)", "Hoàng Thùy Linh", "https://i.ytimg.com/vi/gJHSDZfJrRY/hqdefault.jpg", "3:05", "65M views", "2022")
        ),
        "vpop" to listOf(
            VideoItem("1m_i3_h76tU", "HIEUTHUHAI - Không Thể Say (Official MV)", "HIEUTHUHAI", "https://i.ytimg.com/vi/1m_i3_h76tU/hqdefault.jpg", "3:40", "45M views", "2023"),
            VideoItem("yYnFm3u5UoM", "MONO - Waiting For You (Album '22')", "MONO Official", "https://i.ytimg.com/vi/yYnFm3u5UoM/hqdefault.jpg", "4:25", "105M views", "2022"),
            VideoItem("7c3-Ge_G-pE", "Wren Evans - Từng Quen (Official MV)", "Wren Evans", "https://i.ytimg.com/vi/7c3-Ge_G-pE/hqdefault.jpg", "2:55", "38M views", "2023"),
            VideoItem("4iFP_wd6quo", "CHÚNG TA CỦA TƯƠNG LAI | SƠN TÙNG M-TP", "Sơn Tùng M-TP Official", "https://i.ytimg.com/vi/4iFP_wd6quo/hqdefault.jpg", "4:15", "85M views", "2024")
        ),
        "lofi" to listOf(
            VideoItem("jfKfPfyJRdk", "lofi hip hop radio - beats to relax/study to", "Lofi Girl", "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg", "LIVE", "Trực tiếp", "2024"),
            VideoItem("5yx6BWlEVcY", "Chillhop Radio - jazzy & lofi hip hop beats", "Chillhop Music", "https://i.ytimg.com/vi/5yx6BWlEVcY/hqdefault.jpg", "LIVE", "Trực tiếp", "2024")
        ),
        "acoustic" to listOf(
            VideoItem("F5tS548P45k", "Vũ. - Lạ Lùng (Acoustic Guitar Version)", "Vũ. Official", "https://i.ytimg.com/vi/F5tS548P45k/hqdefault.jpg", "4:21", "110M views", "2023"),
            VideoItem("UVbv-PJXm14", "Đen - Mang Tiền Về Cho Mẹ (Acoustic Live)", "Đen Vâu Official", "https://i.ytimg.com/vi/UVbv-PJXm14/hqdefault.jpg", "6:02", "98M views", "2023")
        ),
        "remix" to listOf(
            VideoItem("7Kpyc8sH9f8", "Pháo - 2 Phút Hơn (KAIZ Remix)", "Spinnin' Records", "https://i.ytimg.com/vi/7Kpyc8sH9f8/hqdefault.jpg", "3:02", "310M views", "2021"),
            VideoItem("hW6BhyuCsmE", "CẮT ĐÔI NỖI SẦU (Vinahouse Remix)", "Tăng Duy Tân", "https://i.ytimg.com/vi/hW6BhyuCsmE/hqdefault.jpg", "3:15", "74M views", "2023")
        )
    )

    suspend fun searchVideos(query: String, categoryId: String? = null): List<VideoItem> = withContext(Dispatchers.IO) {
        val trimmed = query.trim()
        if (trimmed.isEmpty()) return@withContext curatedVideos[categoryId ?: "trending"].orEmpty()

        val apiKey = BuildConfig.YOUTUBE_API_KEY.trim()
        if (apiKey.isNotEmpty()) {
            try {
                return@withContext searchWithYouTubeDataApi(trimmed, apiKey)
            } catch (e: Exception) {
                // Fall back to local data when the key is missing, restricted,
                // quota-exhausted or the device is offline.
            }
        }

        val allCurated = curatedVideos.values.flatten().distinctBy { it.id }
        allCurated.filter {
            it.title.contains(trimmed, true) || it.channelTitle.contains(trimmed, true)
        }.ifEmpty { curatedVideos[categoryId ?: "trending"].orEmpty() }
    }

    private fun searchWithYouTubeDataApi(query: String, apiKey: String): List<VideoItem> {
        val encoded = URLEncoder.encode(query, "UTF-8")
        val endpoint = URL(
            "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=25&q=$encoded&key=${URLEncoder.encode(apiKey, "UTF-8")}"
        )
        val connection = endpoint.openConnection() as HttpURLConnection
        connection.connectTimeout = 10_000
        connection.readTimeout = 10_000
        connection.requestMethod = "GET"
        return connection.inputStream.bufferedReader().use { reader ->
            val root = Gson().fromJson(reader, JsonObject::class.java)
            root.getAsJsonArray("items")?.mapNotNull { item ->
                val obj = item.asJsonObject
                val id = obj.getAsJsonObject("id")?.get("videoId")?.asString ?: return@mapNotNull null
                val snippet = obj.getAsJsonObject("snippet") ?: return@mapNotNull null
                val title = snippet.get("title")?.asString.orEmpty()
                val channel = snippet.get("channelTitle")?.asString.orEmpty()
                val published = snippet.get("publishedAt")?.asString
                val thumbs = snippet.getAsJsonObject("thumbnails")
                val thumb = thumbs?.getAsJsonObject("high")?.get("url")?.asString
                    ?: thumbs?.getAsJsonObject("default")?.get("url")?.asString
                    ?: "https://i.ytimg.com/vi/$id/hqdefault.jpg"
                VideoItem(id, title, channel, thumb, publishedAt = published)
            }.orEmpty()
        }.also { connection.disconnect() }
    }

    fun parseYouTubeUrl(url: String): String? {
        val value = url.trim()
        val patterns = listOf(
            "(?:youtube\\.com\\/(?:[^\\/]+\\/.+\\/|(?:v|e(?:mbed)?)\\/|.*[?&]v=)|youtu\\.be\\/)([^\"&?\\/\\s]{11})",
            "youtube\\.com\\/shorts\\/([^\"&?\\/\\s]{11})"
        )
        for (pattern in patterns) {
            val matcher = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(value)
            if (matcher.find()) return matcher.group(1)
        }
        return value.takeIf { it.length == 11 && it.none { c -> c.isWhitespace() || c == '/' } }
    }
}
