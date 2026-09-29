import { Category, VideoItem } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'trending', name: 'Thịnh hành', iconName: 'Flame', query: 'nhạc việt thịnh hành trending hot nhất' },
  { id: 'vpop', name: 'Nhạc Trẻ Hot', iconName: 'Music2', query: 'v-pop hits mới nhất tuyển chọn' },
  { id: 'lofi', name: 'Lofi Chill', iconName: 'Moon', query: 'lofi chill vn không lời ngủ ngon thư giãn' },
  { id: 'acoustic', name: 'Acoustic', iconName: 'Guitar', query: 'acoustic việt nhẹ nhàng thư giãn' },
  { id: 'remix', name: 'Remix & EDM', iconName: 'Zap', query: 'nhạc trẻ remix bass cực căng vinahouse' },
  { id: 'usuk', name: 'US-UK Billboard', iconName: 'Globe', query: 'billboard top 100 hot hits' },
  { id: 'kpop', name: 'K-Pop Mới', iconName: 'Sparkles', query: 'kpop new releases hits trending' },
  { id: 'podcast', name: 'Podcast', iconName: 'Mic', query: 'podcast vietcetera have a sip' },
  { id: 'study', name: 'Tập Trung', iconName: 'BookOpen', query: 'study music ambient focus work' },
];

export const CURATED_VIDEOS: Record<string, VideoItem[]> = {
  trending: [
    {
      id: 'abPmZCZZrFA',
      title: 'SƠN TÙNG M-TP | ĐỪNG LÀM TRÁI TIM ANH ĐAU | OFFICIAL MUSIC VIDEO',
      channelTitle: 'Sơn Tùng M-TP Official',
      thumbnail: 'https://i.ytimg.com/vi/abPmZCZZrFA/hqdefault.jpg',
      duration: '5:24',
      views: '120M lượt xem',
      publishedAt: '2024'
    },
    {
      id: '8r_C4A_N7Z8',
      title: 'Vũ. - Lạ Lùng (Official Audio)',
      channelTitle: 'Vũ. Official',
      thumbnail: 'https://i.ytimg.com/vi/8r_C4A_N7Z8/hqdefault.jpg',
      duration: '4:21',
      views: '160M lượt xem',
      publishedAt: '2023'
    },
    {
      id: '4BNz8D32f-Y',
      title: 'Đen - Mang Tiền Về Cho Mẹ ft. Nguyên Thảo (M/V)',
      channelTitle: 'Đen Vâu Official',
      thumbnail: 'https://i.ytimg.com/vi/4BNz8D32f-Y/hqdefault.jpg',
      duration: '6:02',
      views: '110M lượt xem',
      publishedAt: '2023'
    },
    {
      id: 'w4cLwPZq8YQ',
      title: 'Wren Evans - Từng Quen (Official Visualizer)',
      channelTitle: 'Wren Evans',
      thumbnail: 'https://i.ytimg.com/vi/w4cLwPZq8YQ/hqdefault.jpg',
      duration: '2:56',
      views: '80M lượt xem',
      publishedAt: '2024'
    },
    {
      id: 'Ypl84cT-M_E',
      title: 'HIEUTHUHAI - Không Thể Say (Official Music Video)',
      channelTitle: 'HIEUTHUHAI',
      thumbnail: 'https://i.ytimg.com/vi/Ypl84cT-M_E/hqdefault.jpg',
      duration: '3:45',
      views: '55M lượt xem',
      publishedAt: '2023'
    },
    {
      id: 'p7f6Ld_eJbQ',
      title: 'Chillies - Vùng Ký Ức (Official Music Video)',
      channelTitle: 'Chillies',
      thumbnail: 'https://i.ytimg.com/vi/p7f6Ld_eJbQ/hqdefault.jpg',
      duration: '4:48',
      views: '92M lượt xem',
      publishedAt: '2023'
    },
    {
      id: 'LQC5fP115kQ',
      title: 'GREY D x CHILLIES - vaicaunoicokhiennguoithaydoi (Official Visualizer)',
      channelTitle: 'ST.319 Entertainment',
      thumbnail: 'https://i.ytimg.com/vi/LQC5fP115kQ/hqdefault.jpg',
      duration: '3:50',
      views: '65M lượt xem',
      publishedAt: '2023'
    },
    {
      id: 'gMmsz6j5Hk8',
      title: 'Phương Mỹ Chi - Vũ Trụ Có Anh ft. Pháo (Official Music Video)',
      channelTitle: 'Phương Mỹ Chi',
      thumbnail: 'https://i.ytimg.com/vi/gMmsz6j5Hk8/hqdefault.jpg',
      duration: '3:35',
      views: '45M lượt xem',
      publishedAt: '2023'
    }
  ],
  vpop: [
    {
      id: 'abPmZCZZrFA',
      title: 'SƠN TÙNG M-TP | ĐỪNG LÀM TRÁI TIM ANH ĐAU | OFFICIAL MUSIC VIDEO',
      channelTitle: 'Sơn Tùng M-TP Official',
      thumbnail: 'https://i.ytimg.com/vi/abPmZCZZrFA/hqdefault.jpg',
      duration: '5:24',
      views: '120M lượt xem',
      publishedAt: '2024'
    },
    {
      id: '8r_C4A_N7Z8',
      title: 'Vũ. - Lạ Lùng (Official Audio)',
      channelTitle: 'Vũ. Official',
      thumbnail: 'https://i.ytimg.com/vi/8r_C4A_N7Z8/hqdefault.jpg',
      duration: '4:21',
      views: '160M lượt xem',
      publishedAt: '2023'
    },
    {
      id: 'w4cLwPZq8YQ',
      title: 'Wren Evans - Từng Quen (Official Visualizer)',
      channelTitle: 'Wren Evans',
      thumbnail: 'https://i.ytimg.com/vi/w4cLwPZq8YQ/hqdefault.jpg',
      duration: '2:56',
      views: '80M lượt xem',
      publishedAt: '2024'
    },
    {
      id: 'Ypl84cT-M_E',
      title: 'HIEUTHUHAI - Không Thể Say (Official Music Video)',
      channelTitle: 'HIEUTHUHAI',
      thumbnail: 'https://i.ytimg.com/vi/Ypl84cT-M_E/hqdefault.jpg',
      duration: '3:45',
      views: '55M lượt xem',
      publishedAt: '2023'
    },
    {
      id: 'p7f6Ld_eJbQ',
      title: 'Chillies - Vùng Ký Ức (Official Music Video)',
      channelTitle: 'Chillies',
      thumbnail: 'https://i.ytimg.com/vi/p7f6Ld_eJbQ/hqdefault.jpg',
      duration: '4:48',
      views: '92M lượt xem',
      publishedAt: '2023'
    },
    {
      id: '4BNz8D32f-Y',
      title: 'Đen - Mang Tiền Về Cho Mẹ ft. Nguyên Thảo (M/V)',
      channelTitle: 'Đen Vâu Official',
      thumbnail: 'https://i.ytimg.com/vi/4BNz8D32f-Y/hqdefault.jpg',
      duration: '6:02',
      views: '110M lượt xem',
      publishedAt: '2023'
    }
  ],
  lofi: [
    {
      id: 'jfKfPfyJRdk',
      title: 'lofi hip hop radio - beats to relax/study to',
      channelTitle: 'Lofi Girl',
      thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
      duration: 'LIVE',
      views: 'Trực tiếp 24/7',
      publishedAt: 'Trực tiếp'
    },
    {
      id: 'rUxyKA_-dbg',
      title: 'lofi hip hop radio - beats to sleep/chill to',
      channelTitle: 'Lofi Girl',
      thumbnail: 'https://i.ytimg.com/vi/rUxyKA_-dbg/hqdefault.jpg',
      duration: 'LIVE',
      views: 'Trực tiếp 24/7',
      publishedAt: 'Trực tiếp'
    },
    {
      id: '7NOSDKb0HlU',
      title: 'Lofi Việt Nhẹ Nhàng êm dịu - Nhạc lofi chill ru ngủ sâu',
      channelTitle: 'Lofi Chill Vietnam',
      thumbnail: 'https://i.ytimg.com/vi/7NOSDKb0HlU/hqdefault.jpg',
      duration: '1:15:30',
      views: '15M lượt xem',
      publishedAt: '2024'
    },
    {
      id: 'n61ULEU7SU0',
      title: 'Nhạc Lofi Guitar không lời nhẹ nhàng thư giãn học tập',
      channelTitle: 'Acoustic Guitar Lofi',
      thumbnail: 'https://i.ytimg.com/vi/n61ULEU7SU0/hqdefault.jpg',
      duration: '2:05:12',
      views: '8.4M lượt xem',
      publishedAt: '2024'
    }
  ],
  acoustic: [
    {
      id: '8r_C4A_N7Z8',
      title: 'Vũ. - Lạ Lùng (Official Audio)',
      channelTitle: 'Vũ. Official',
      thumbnail: 'https://i.ytimg.com/vi/8r_C4A_N7Z8/hqdefault.jpg',
      duration: '4:21',
      views: '160M lượt xem',
      publishedAt: '2023'
    },
    {
      id: 'p7f6Ld_eJbQ',
      title: 'Chillies - Vùng Ký Ức (Official Music Video)',
      channelTitle: 'Chillies',
      thumbnail: 'https://i.ytimg.com/vi/p7f6Ld_eJbQ/hqdefault.jpg',
      duration: '4:48',
      views: '92M lượt xem',
      publishedAt: '2023'
    },
    {
      id: 'n61ULEU7SU0',
      title: 'Nhạc Acoustic Guitar không lời nhẹ nhàng thư giãn',
      channelTitle: 'Acoustic Chill',
      thumbnail: 'https://i.ytimg.com/vi/n61ULEU7SU0/hqdefault.jpg',
      duration: '2:05:12',
      views: '8.4M lượt xem',
      publishedAt: '2024'
    }
  ],
  remix: [
    {
      id: 'dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up (EDM Festival Remix)',
      channelTitle: 'Rick Astley',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      duration: '3:32',
      views: '1.4B lượt xem',
      publishedAt: '2023'
    },
    {
      id: 'kJQP7kiw5Fk',
      title: 'Luis Fonsi - Despacito (Ultra Dance Remix)',
      channelTitle: 'Luis Fonsi',
      thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
      duration: '4:42',
      views: '8.5B lượt xem',
      publishedAt: '2023'
    }
  ],
  usuk: [
    {
      id: 'kJQP7kiw5Fk',
      title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
      channelTitle: 'Luis Fonsi',
      thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
      duration: '4:42',
      views: '8.5B lượt xem',
      publishedAt: '2017'
    },
    {
      id: 'JGwWNGJdvx8',
      title: 'Ed Sheeran - Shape of You (Official Music Video)',
      channelTitle: 'Ed Sheeran',
      thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
      duration: '4:24',
      views: '6.2B lượt xem',
      publishedAt: '2017'
    },
    {
      id: '4NRXx6U8ABQ',
      title: 'The Weeknd - Blinding Lights (Official Video)',
      channelTitle: 'The Weeknd',
      thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
      duration: '4:20',
      views: '800M lượt xem',
      publishedAt: '2020'
    }
  ],
  kpop: [
    {
      id: 'ioNng23DkIM',
      title: 'BLACKPINK - ‘Pink Venom’ M/V',
      channelTitle: 'BLACKPINK',
      thumbnail: 'https://i.ytimg.com/vi/ioNng23DkIM/hqdefault.jpg',
      duration: '3:13',
      views: '900M lượt xem',
      publishedAt: '2022'
    },
    {
      id: 'armS_oE_o_A',
      title: 'NewJeans (뉴진스) \'Supernatural\' Official MV',
      channelTitle: 'HYBE LABELS',
      thumbnail: 'https://i.ytimg.com/vi/armS_oE_o_A/hqdefault.jpg',
      duration: '3:20',
      views: '60M lượt xem',
      publishedAt: '2024'
    }
  ],
  podcast: [
    {
      id: '2B3B3W56_fI',
      title: 'Have A Sip | Podcast Vietcetera - Những chia sẻ lắng đọng',
      channelTitle: 'Vietcetera',
      thumbnail: 'https://i.ytimg.com/vi/2B3B3W56_fI/hqdefault.jpg',
      duration: '58:20',
      views: '1.2M lượt xem',
      publishedAt: '2024'
    },
    {
      id: 'lTRiuFIWV54',
      title: 'Giang Ơi Radio | Chữa lành cảm xúc & Tư duy tích cực',
      channelTitle: 'Giang Ơi',
      thumbnail: 'https://i.ytimg.com/vi/lTRiuFIWV54/hqdefault.jpg',
      duration: '34:10',
      views: '850K lượt xem',
      publishedAt: '2024'
    }
  ],
  study: [
    {
      id: 'jfKfPfyJRdk',
      title: 'lofi hip hop radio 📚 - beats to relax/study to',
      channelTitle: 'Lofi Girl',
      thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
      duration: 'LIVE',
      views: 'Trực tiếp 24/7',
      publishedAt: 'Trực tiếp'
    },
    {
      id: 'n61ULEU7SU0',
      title: 'Nhạc Lofi Guitar không lời nhẹ nhàng thư giãn học tập',
      channelTitle: 'Acoustic Guitar Lofi',
      thumbnail: 'https://i.ytimg.com/vi/n61ULEU7SU0/hqdefault.jpg',
      duration: '2:05:12',
      views: '8.4M lượt xem',
      publishedAt: '2024'
    }
  ]
};

// Map real YouTube thumbnails for reliable loading
export function getReliableThumbnail(videoId: string, fallback?: string): string {
  if (videoId) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }
  return fallback || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60';
}
