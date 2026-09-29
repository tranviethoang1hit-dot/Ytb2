package com.example.ytmusicplayer.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
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
import com.example.ytmusicplayer.ui.components.*
import com.example.ytmusicplayer.ui.theme.RedPrimary
import com.example.ytmusicplayer.ui.viewmodel.PlayerViewModel
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(viewModel: PlayerViewModel) {
    val activeTab by viewModel.activeTab.collectAsState()
    val selectedCategory by viewModel.selectedCategory.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val isSearching by viewModel.isSearching.collectAsState()
    val displayedVideos by viewModel.displayedVideos.collectAsState()
    val playerState by viewModel.playerState.collectAsState()
    val sleepTimerSeconds by viewModel.sleepTimerSecondsLeft.collectAsState()
    val adBlockStats by viewModel.adBlockStats.collectAsState()

    val favorites by viewModel.favorites.collectAsState()
    val history by viewModel.history.collectAsState()
    val playlists by viewModel.playlists.collectAsState()
    val offlineVideos by viewModel.offlineVideos.collectAsState()
    val queue by viewModel.queue.collectAsState()

    // Modals
    val isFullPlayerOpen by viewModel.isFullPlayerOpen.collectAsState()
    val isQueueDrawerOpen by viewModel.isQueueDrawerOpen.collectAsState()
    val isSleepTimerOpen by viewModel.isSleepTimerDialogOpen.collectAsState()
    val isDirectUrlOpen by viewModel.isDirectUrlDialogOpen.collectAsState()
    val isAdShieldOpen by viewModel.isAdShieldDialogOpen.collectAsState()
    val isPlaylistOpen by viewModel.isPlaylistDialogOpen.collectAsState()
    val isDownloadOpen by viewModel.isDownloadDialogOpen.collectAsState()
    val actionVideo by viewModel.selectedVideoForAction.collectAsState()

    val favoriteIds = remember(favorites) { favorites.map { it.id }.toSet() }

    Scaffold(
        topBar = {
            TopNavBar(
                searchQuery = searchQuery,
                onSearchChange = { viewModel.search(it) },
                onSearchSubmit = { viewModel.search(it) },
                sleepTimerSeconds = sleepTimerSeconds,
                onOpenSleepTimer = { viewModel.isSleepTimerDialogOpen.value = true },
                onOpenDirectUrl = { viewModel.isDirectUrlDialogOpen.value = true },
                onOpenAdShield = { viewModel.isAdShieldDialogOpen.value = true }
            )
        },
        bottomBar = {
            Column {
                // Persistent mini player bar above tabs
                if (playerState.currentVideo != null) {
                    BottomPlayerBar(
                        playerState = playerState,
                        onTogglePlayPause = { viewModel.togglePlayPause() },
                        onNext = { viewModel.playNext() },
                        onOpenFullPlayer = { viewModel.isFullPlayerOpen.value = true }
                    )
                }

                // Modern YouTube Music Navigation Bar
                Surface(
                    color = Color(0xFF030303),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column {
                        HorizontalDivider(color = Color(0xFF1E1E1E), thickness = 1.dp)
                        NavigationBar(
                            containerColor = Color(0xFF030303),
                            tonalElevation = 0.dp
                        ) {
                            val navTabs = listOf(
                                Triple(0, "Trang chủ", Icons.Default.Explore),
                                Triple(1, "Yêu thích", Icons.Default.Favorite),
                                Triple(2, "Playlist", Icons.Default.QueueMusic),
                                Triple(3, "Lịch sử", Icons.Default.History),
                                Triple(4, "Đã tải", Icons.Default.DownloadDone)
                            )
                            navTabs.forEach { (index, title, icon) ->
                                val selected = activeTab == index
                                NavigationBarItem(
                                    selected = selected,
                                    onClick = { viewModel.activeTab.value = index },
                                    icon = {
                                        Icon(
                                            imageVector = icon,
                                            contentDescription = title,
                                            tint = if (selected) Color.White else Color(0xFF8E8E93),
                                            modifier = Modifier.size(24.dp)
                                        )
                                    },
                                    label = {
                                        Text(
                                            text = title,
                                            fontSize = 10.sp,
                                            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                            color = if (selected) Color.White else Color(0xFF8E8E93)
                                        )
                                    },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = Color.White,
                                        selectedTextColor = Color.White,
                                        unselectedIconColor = Color(0xFF8E8E93),
                                        unselectedTextColor = Color(0xFF8E8E93),
                                        indicatorColor = Color.Transparent
                                    )
                                )
                            }
                        }
                    }
                }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (activeTab) {
                // Tab 0: Explore
                0 -> ExploreTabContent(
                    categories = viewModel.categories,
                    selectedCategory = selectedCategory,
                    onCategorySelected = { viewModel.selectCategory(it) },
                    videos = displayedVideos,
                    favoriteIds = favoriteIds,
                    isSearching = isSearching,
                    onPlayVideo = { viewModel.playVideo(it) },
                    onToggleFavorite = { viewModel.toggleFavorite(it) },
                    onAddToPlaylist = { video ->
                        viewModel.selectedVideoForAction.value = video
                        viewModel.isPlaylistDialogOpen.value = true
                    },
                    onDownload = { video ->
                        viewModel.selectedVideoForAction.value = video
                        viewModel.isDownloadDialogOpen.value = true
                    }
                )

                // Tab 1: Favorites
                1 -> FavoritesTabContent(
                    favorites = favorites,
                    onPlayVideo = { entity ->
                        viewModel.playVideo(
                            VideoItem(
                                id = entity.id,
                                title = entity.title,
                                channelTitle = entity.channelTitle,
                                thumbnail = entity.thumbnail,
                                duration = entity.duration,
                                views = entity.views
                            )
                        )
                    },
                    onPlayAll = {
                        val items = favorites.map {
                            VideoItem(it.id, it.title, it.channelTitle, it.thumbnail, it.duration, it.views)
                        }
                        viewModel.playQueue(items, 0)
                    },
                    onRemoveFavorite = { entity ->
                        viewModel.toggleFavorite(
                            VideoItem(entity.id, entity.title, entity.channelTitle, entity.thumbnail)
                        )
                    }
                )

                // Tab 2: Playlists
                2 -> PlaylistsTabContent(
                    playlists = playlists,
                    onCreatePlaylist = {
                        viewModel.isPlaylistDialogOpen.value = true
                        viewModel.selectedVideoForAction.value = null
                    },
                    onPlayPlaylist = { playlist ->
                        val gson = Gson()
                        val type = object : TypeToken<List<VideoItem>>() {}.type
                        val list: List<VideoItem> = try {
                            gson.fromJson(playlist.videosJson, type) ?: emptyList()
                        } catch (e: Exception) {
                            emptyList()
                        }
                        if (list.isNotEmpty()) {
                            viewModel.playQueue(list, 0)
                        }
                    }
                )

                // Tab 3: History
                3 -> HistoryTabContent(
                    history = history,
                    onPlayVideo = { entity ->
                        viewModel.playVideo(
                            VideoItem(
                                id = entity.id,
                                title = entity.title,
                                channelTitle = entity.channelTitle,
                                thumbnail = entity.thumbnail,
                                duration = entity.duration,
                                views = entity.views
                            )
                        )
                    },
                    onClearHistory = { viewModel.clearHistory() }
                )

                // Tab 4: Downloads
                4 -> DownloadsTabContent(
                    downloads = offlineVideos,
                    onPlayOffline = { entity ->
                        viewModel.playOffline(entity)
                    },
                    onDeleteDownload = { viewModel.deleteOfflineVideo(it) }
                )
            }
        }
    }

    // Modal: Full Player Bottom Sheet
    if (isFullPlayerOpen && playerState.currentVideo != null) {
        val currentVideo = playerState.currentVideo!!
        FullPlayerSheet(
            playerState = playerState,
            isFavorite = favoriteIds.contains(currentVideo.id),
            onDismiss = { viewModel.isFullPlayerOpen.value = false },
            onTogglePlayPause = { viewModel.togglePlayPause() },
            onNext = { viewModel.playNext() },
            onPrevious = { viewModel.playPrevious() },
            onSeekTo = { viewModel.seekTo(it) },
            onToggleShuffle = { viewModel.toggleShuffle() },
            onCycleRepeat = { viewModel.cycleRepeatMode() },
            onToggleFavorite = { viewModel.toggleFavorite(currentVideo) },
            onSetPlaybackSpeed = { viewModel.setPlaybackSpeed(it) },
            onOpenSleepTimer = { viewModel.isSleepTimerDialogOpen.value = true },
            onOpenQueue = { viewModel.isQueueDrawerOpen.value = true }
        )
    }

    // Modal: Queue Drawer Sheet
    if (isQueueDrawerOpen) {
        QueueSheet(
            queue = queue,
            currentVideo = playerState.currentVideo,
            onPlayVideo = { viewModel.playVideo(it) },
            onDismiss = { viewModel.isQueueDrawerOpen.value = false }
        )
    }

    // Dialog: Sleep Timer
    if (isSleepTimerOpen) {
        SleepTimerDialog(
            secondsRemaining = sleepTimerSeconds,
            onSetTimer = { viewModel.setSleepTimer(it) },
            onCancelTimer = { viewModel.cancelSleepTimer() },
            onDismiss = { viewModel.isSleepTimerDialogOpen.value = false }
        )
    }

    // Dialog: Direct YouTube URL
    if (isDirectUrlOpen) {
        DirectUrlDialog(
            onPlayUrl = { viewModel.playDirectUrl(it) },
            onDismiss = { viewModel.isDirectUrlDialogOpen.value = false }
        )
    }

    // Dialog: Ad Shield
    if (isAdShieldOpen) {
        AdShieldDialog(
            stats = adBlockStats,
            onDismiss = { viewModel.isAdShieldDialogOpen.value = false }
        )
    }

    // Dialog: Playlist
    if (isPlaylistOpen) {
        PlaylistDialog(
            video = actionVideo,
            playlists = playlists,
            onCreatePlaylist = { name, desc -> viewModel.createPlaylist(name, desc) },
            onAddToPlaylist = { pl, v -> viewModel.addVideoToPlaylist(pl, v) },
            onDismiss = { viewModel.isPlaylistDialogOpen.value = false }
        )
    }

    // Dialog: Download
    if (isDownloadOpen) {
        DownloadDialog(
            video = actionVideo,
            onConfirmDownload = { v, res -> viewModel.startDownload(v, res) },
            onDismiss = { viewModel.isDownloadDialogOpen.value = false }
        )
    }
}

@Composable
fun ExploreTabContent(
    categories: List<Category>,
    selectedCategory: String,
    onCategorySelected: (String) -> Unit,
    videos: List<VideoItem>,
    favoriteIds: Set<String>,
    isSearching: Boolean,
    onPlayVideo: (VideoItem) -> Unit,
    onToggleFavorite: (VideoItem) -> Unit,
    onAddToPlaylist: (VideoItem) -> Unit,
    onDownload: (VideoItem) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Categories Row
        CategoryChipsRow(
            categories = categories,
            selectedCategoryId = selectedCategory,
            onCategorySelected = onCategorySelected
        )

        if (isSearching) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = RedPrimary)
            }
        } else if (videos.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Không tìm thấy bài hát nào", color = Color(0xFFAAAAAA))
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Section 1: Carousel for top picks (if not filtered by specific search)
                val carouselItems = videos.take(6)
                if (carouselItems.isNotEmpty()) {
                    item {
                        Column {
                            Text(
                                text = "Gợi ý cho bạn",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            androidx.compose.foundation.lazy.LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(14.dp)
                            ) {
                                items(carouselItems) { video ->
                                    VideoCarouselCard(
                                        video = video,
                                        isFavorite = favoriteIds.contains(video.id),
                                        onPlay = { onPlayVideo(video) },
                                        onToggleFavorite = { onToggleFavorite(video) },
                                        onAddToPlaylist = { onAddToPlaylist(video) },
                                        onDownload = { onDownload(video) }
                                    )
                                }
                            }
                        }
                    }
                }

                // Section 2: Top Charts Ranked List
                item {
                    Text(
                        text = "Bảng xếp hạng thịnh hành",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }

                androidx.compose.foundation.lazy.itemsIndexed(videos) { index, video ->
                    VideoListRow(
                        video = video,
                        rank = index + 1,
                        isFavorite = favoriteIds.contains(video.id),
                        onPlay = { onPlayVideo(video) },
                        onToggleFavorite = { onToggleFavorite(video) },
                        onAddToPlaylist = { onAddToPlaylist(video) },
                        onDownload = { onDownload(video) }
                    )
                }
            }
        }
    }
}

@Composable
fun FavoritesTabContent(
    favorites: List<FavoriteEntity>,
    onPlayVideo: (FavoriteEntity) -> Unit,
    onPlayAll: () -> Unit,
    onRemoveFavorite: (FavoriteEntity) -> Unit
) {
    if (favorites.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.FavoriteBorder, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(56.dp))
                Spacer(modifier = Modifier.height(12.dp))
                Text("Chưa có bài hát yêu thích", fontWeight = FontWeight.Bold, color = Color.White)
                Text("Nhấn vào biểu tượng trái tim để lưu bài hát", color = Color.Gray, fontSize = 13.sp)
            }
        }
    } else {
        Column(modifier = Modifier.fillMaxSize().padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Bài hát yêu thích (${favorites.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
                Button(
                    onClick = onPlayAll,
                    colors = ButtonDefaults.buttonColors(containerColor = RedPrimary),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Phát tất cả", fontSize = 12.sp)
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(favorites) { entity ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(MaterialTheme.colorScheme.surface)
                            .clickable { onPlayVideo(entity) }
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        AsyncImage(
                            model = entity.thumbnail,
                            contentDescription = null,
                            modifier = Modifier.size(54.dp).clip(RoundedCornerShape(8.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(entity.title, fontWeight = FontWeight.SemiBold, color = Color.White, fontSize = 14.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text(entity.channelTitle, color = Color.Gray, fontSize = 12.sp)
                        }
                        IconButton(onClick = { onRemoveFavorite(entity) }) {
                            Icon(Icons.Default.Favorite, contentDescription = "Bỏ thích", tint = RedPrimary)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PlaylistsTabContent(
    playlists: List<PlaylistEntity>,
    onCreatePlaylist: () -> Unit,
    onPlayPlaylist: (PlaylistEntity) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().padding(14.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Danh sách phát", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
            Button(
                onClick = onCreatePlaylist,
                colors = ButtonDefaults.buttonColors(containerColor = RedPrimary),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Tạo mới", fontSize = 12.sp)
            }
        }
        Spacer(modifier = Modifier.height(12.dp))

        if (playlists.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Chưa có danh sách phát nào", color = Color.Gray)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(playlists) { pl ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(MaterialTheme.colorScheme.surface)
                            .clickable { onPlayPlaylist(pl) }
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.QueueMusic, contentDescription = null, tint = RedPrimary)
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(pl.title, fontWeight = FontWeight.SemiBold, color = Color.White, fontSize = 15.sp)
                            Text(pl.description ?: "Danh sách tùy chọn", color = Color.Gray, fontSize = 12.sp)
                        }
                        Icon(Icons.Default.PlayArrow, contentDescription = "Phát", tint = Color.LightGray)
                    }
                }
            }
        }
    }
}

@Composable
fun HistoryTabContent(
    history: List<HistoryEntity>,
    onPlayVideo: (HistoryEntity) -> Unit,
    onClearHistory: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().padding(14.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Lịch sử nghe (${history.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
            if (history.isNotEmpty()) {
                TextButton(onClick = onClearHistory) {
                    Text("Xóa lịch sử", color = Color.Red, fontSize = 12.sp)
                }
            }
        }
        Spacer(modifier = Modifier.height(12.dp))

        if (history.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Chưa có lịch sử phát gần đây", color = Color.Gray)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(history) { item ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.surface)
                            .clickable { onPlayVideo(item) }
                            .padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        AsyncImage(
                            model = item.thumbnail,
                            contentDescription = null,
                            modifier = Modifier.size(46.dp).clip(RoundedCornerShape(6.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(item.title, fontWeight = FontWeight.Medium, color = Color.White, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text(item.channelTitle, color = Color.Gray, fontSize = 11.sp)
                        }
                        Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.LightGray)
                    }
                }
            }
        }
    }
}

@Composable
fun DownloadsTabContent(
    downloads: List<OfflineVideoEntity>,
    onPlayOffline: (OfflineVideoEntity) -> Unit,
    onDeleteDownload: (OfflineVideoEntity) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().padding(14.dp)) {
        Text("Nhạc đã tải ngoại tuyến (${downloads.size})", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color.White)
        Spacer(modifier = Modifier.height(12.dp))

        if (downloads.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.DownloadDone, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(56.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Chưa có bài hát ngoại tuyến", fontWeight = FontWeight.Bold, color = Color.White)
                    Text("Tải bài hát để nghe khi không có mạng 4G/WiFi", color = Color.Gray, fontSize = 13.sp)
                }
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(downloads) { item ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(MaterialTheme.colorScheme.surface)
                            .clickable { onPlayOffline(item) }
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        AsyncImage(
                            model = item.thumbnail,
                            contentDescription = null,
                            modifier = Modifier.size(50.dp).clip(RoundedCornerShape(8.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(item.title, fontWeight = FontWeight.SemiBold, color = Color.White, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text("${item.resolution} • ${item.format.uppercase()}", color = RedPrimary, fontSize = 11.sp)
                        }
                        IconButton(onClick = { onDeleteDownload(item) }) {
                            Icon(Icons.Default.DeleteOutline, contentDescription = "Xóa", tint = Color.Gray)
                        }
                    }
                }
            }
        }
    }
}
