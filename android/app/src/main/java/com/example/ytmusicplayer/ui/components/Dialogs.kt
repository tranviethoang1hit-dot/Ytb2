package com.example.ytmusicplayer.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.ytmusicplayer.data.model.*
import com.example.ytmusicplayer.ui.theme.RedPrimary

@Composable
fun SleepTimerDialog(
    secondsRemaining: Int?,
    onSetTimer: (Int) -> Unit,
    onCancelTimer: () -> Unit,
    onDismiss: () -> Unit
) {
    val presets = listOf(15, 30, 45, 60, 90)

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Bedtime, contentDescription = null, tint = RedPrimary)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Hẹn giờ dừng phát nhạc", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            }
        },
        text = {
            Column {
                if (secondsRemaining != null) {
                    val mins = secondsRemaining / 60
                    val secs = secondsRemaining % 60
                    Text(
                        text = "Đang đếm ngược: %02d:%02d".format(mins, secs),
                        color = RedPrimary,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                }

                Text("Chọn thời gian nhạc tự động tắt khi bạn ngủ:", fontSize = 14.sp, color = Color.LightGray)
                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    presets.forEach { mins ->
                        Button(
                            onClick = { onSetTimer(mins) },
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(horizontal = 2.dp, vertical = 6.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Text("${mins}p", fontSize = 12.sp, color = Color.White)
                        }
                    }
                }
            }
        },
        confirmButton = {
            if (secondsRemaining != null) {
                TextButton(onClick = onCancelTimer) {
                    Text("Hủy hẹn giờ", color = Color.Red)
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Đóng")
            }
        }
    )
}

@Composable
fun DirectUrlDialog(
    onPlayUrl: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var urlText by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Link, contentDescription = null, tint = RedPrimary)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Mở bằng liên kết", fontWeight = FontWeight.Bold, fontSize = 18.sp)
            }
        },
        text = {
            Column {
                Text(
                    text = "Dán liên kết YouTube để mở bằng trình phát YouTube chính thức, hoặc dán URL audio/video trực tiếp mà bạn có quyền sử dụng:",
                    fontSize = 13.sp,
                    color = Color.LightGray
                )
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = urlText,
                    onValueChange = { urlText = it },
                    placeholder = { Text("https://youtube.com/watch?v=... hoặc https://example.com/song.mp3", fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onPlayUrl(urlText) },
                enabled = urlText.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = RedPrimary)
            ) {
                Text("Phát ngay")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Đóng")
            }
        }
    )
}

@Composable
fun AdShieldDialog(
    stats: AdBlockStats,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(Icons.Default.Shield, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(36.dp))
        },
        title = {
            Text("Quảng cáo & giới hạn", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    "Ứng dụng không can thiệp, chặn hoặc loại bỏ quảng cáo của YouTube. YouTube được mở bằng trình phát chính thức; phần phát nền của ứng dụng chỉ dành cho media trực tiếp/local.",
                    fontSize = 13.sp,
                    color = Color.LightGray
                )
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("${stats.blockedCount}", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Color(0xFF10B981))
                            Text("Trạng thái chặn quảng cáo", fontSize = 11.sp, color = Color.Gray)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("${stats.timeSavedSeconds / 60} phút", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = RedPrimary)
                            Text("Không áp dụng cho YouTube", fontSize = 11.sp, color = Color.Gray)
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
            ) {
                Text("Đã hiểu")
            }
        }
    )
}

@Composable
fun PlaylistDialog(
    video: VideoItem?,
    playlists: List<PlaylistEntity>,
    onCreatePlaylist: (String, String?) -> Unit,
    onAddToPlaylist: (PlaylistEntity, VideoItem) -> Unit,
    onDismiss: () -> Unit
) {
    var newPlaylistName by remember { mutableStateOf("") }
    var isCreatingNew by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(if (isCreatingNew) "Tạo danh sách mới" else "Thêm vào danh sách", fontWeight = FontWeight.Bold)
        },
        text = {
            Column {
                if (isCreatingNew) {
                    OutlinedTextField(
                        value = newPlaylistName,
                        onValueChange = { newPlaylistName = it },
                        label = { Text("Tên danh sách") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    if (playlists.isEmpty()) {
                        Text("Chưa có danh sách phát nào. Nhấn Tạo mới để bắt đầu.", fontSize = 13.sp, color = Color.Gray)
                    } else {
                        LazyColumn(modifier = Modifier.heightIn(max = 200.dp)) {
                            items(playlists) { pl ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            if (video != null) onAddToPlaylist(pl, video)
                                        }
                                        .padding(vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Default.QueueMusic, contentDescription = null, tint = RedPrimary)
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Text(pl.title, fontWeight = FontWeight.Medium, color = Color.White)
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            if (isCreatingNew) {
                Button(
                    onClick = {
                        if (newPlaylistName.isNotBlank()) {
                            onCreatePlaylist(newPlaylistName, null)
                            isCreatingNew = false
                            newPlaylistName = ""
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = RedPrimary)
                ) {
                    Text("Tạo")
                }
            } else {
                TextButton(onClick = { isCreatingNew = true }) {
                    Text("Tạo mới")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Đóng")
            }
        }
    )
}

@Composable
fun DownloadDialog(
    video: VideoItem?,
    onConfirmDownload: (VideoItem, VideoResolutionId) -> Unit,
    onDismiss: () -> Unit
) {
    if (video == null) return

    val options = listOf(VideoResolutionId.ORIGINAL)
    var selectedOption by remember { mutableStateOf(VideoResolutionId.ORIGINAL) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text("Tải video/nhạc ngoại tuyến", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        },
        text = {
            Column {
                Text(
                    text = video.title,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text("Chọn định dạng & chất lượng tải:", fontSize = 12.sp, color = Color.LightGray)
                Spacer(modifier = Modifier.height(8.dp))

                options.forEach { opt ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedOption = opt }
                            .padding(vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedOption == opt,
                            onClick = { selectedOption = opt },
                            colors = RadioButtonDefaults.colors(selectedColor = RedPrimary)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(opt.label, fontWeight = FontWeight.Medium, color = Color.White)
                            Text("Tải nguyên bản từ URL media trực tiếp", fontSize = 11.sp, color = Color.Gray)
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirmDownload(video, selectedOption) },
                colors = ButtonDefaults.buttonColors(containerColor = RedPrimary)
            ) {
                Text("Tải về")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Hủy")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QueueSheet(
    queue: List<VideoItem>,
    currentVideo: VideoItem?,
    onPlayVideo: (VideoItem) -> Unit,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 10.dp)
        ) {
            Text(
                text = "Danh sách phát hiện tại (${queue.size} bài)",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp,
                color = Color.White
            )
            Spacer(modifier = Modifier.height(12.dp))

            LazyColumn(modifier = Modifier.fillMaxHeight(0.6f)) {
                itemsIndexed(queue) { index, item ->
                    val isCurrent = item.id == currentVideo?.id
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onPlayVideo(item) }
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "${index + 1}",
                            fontSize = 13.sp,
                            color = if (isCurrent) RedPrimary else Color.Gray,
                            fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal,
                            modifier = Modifier.width(28.dp)
                        )
                        AsyncImage(
                            model = item.thumbnail,
                            contentDescription = null,
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(6.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = item.title,
                                fontSize = 13.sp,
                                fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal,
                                color = if (isCurrent) RedPrimary else Color.White,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                text = item.channelTitle,
                                fontSize = 11.sp,
                                color = Color.Gray,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        if (isCurrent) {
                            Icon(Icons.Default.GraphicEq, contentDescription = null, tint = RedPrimary)
                        }
                    }
                }
            }
        }
    }
}
