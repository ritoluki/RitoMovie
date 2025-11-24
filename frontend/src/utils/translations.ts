// Mapping các thể loại phim từ tiếng Việt sang tiếng Anh
export const genreTranslations: Record<string, string> = {
    'Hành Động': 'Action',
    'Cổ Trang': 'Period Drama',
    'Tài Liệu': 'Documentary',
    'Bí Ẩn': 'Mystery',
    'Tâm Lý': 'Psychological',
    'Học Đường': 'School',
    'Hài Hước': 'Comedy',
    'Võ Thuật': 'Martial Arts',
    'Khoa Học': 'Science',
    'Thần Thoại': 'Mythology',
    'Kinh Dị': 'Horror',
    'Phiêu Lưu': 'Adventure',
    'Chính Kịch': 'Drama',
    'Gia Đình': 'Family',
    'Lịch Sử': 'History',
    'Âm Nhạc': 'Music',
    'Viễn Tưởng': 'Fantasy',
    'Thể Thao': 'Sports',
    'Phim 18+': 'Adult',
    'Tình Cảm': 'Romance',
    'Trẻ Em': 'Kids',
    'Hoạt Hình': 'Animation',
    'Hình Sự': 'Crime',
    'Chiến Tranh': 'War',
    'Miền Tây': 'Western',
    'Kinh Điển': 'Classic',
    'Phim Bộ': 'TV Series',
    'Phim Lẻ': 'Movie',
};

// Mapping các quốc gia từ tiếng Việt sang tiếng Anh
export const countryTranslations: Record<string, string> = {
    'Trung Quốc': 'China',
    'Hàn Quốc': 'South Korea',
    'Nhật Bản': 'Japan',
    'Thái Lan': 'Thailand',
    'Âu Mỹ': 'Western',
    'Đài Loan': 'Taiwan',
    'Hồng Kông': 'Hong Kong',
    'Ấn Độ': 'India',
    'Anh': 'United Kingdom',
    'Pháp': 'France',
    'Canada': 'Canada',
    'Quốc Gia Khác': 'Other',
    'Đức': 'Germany',
    'Tây Ban Nha': 'Spain',
    'Thổ Nhĩ Kỳ': 'Turkey',
    'Hà Lan': 'Netherlands',
    'Indonesia': 'Indonesia',
    'Nga': 'Russia',
    'Mexico': 'Mexico',
    'Ba Lan': 'Poland',
    'Úc': 'Australia',
    'Thụy Điển': 'Sweden',
    'Malaysia': 'Malaysia',
    'Brazil': 'Brazil',
    'Philippines': 'Philippines',
    'Bồ Đào Nha': 'Portugal',
    'Ý': 'Italy',
    'Đan Mạch': 'Denmark',
    'UAE': 'UAE',
    'Na Uy': 'Norway',
    'Thụy Sỹ': 'Switzerland',
    'Châu Phi': 'Africa',
    'Nam Phi': 'South Africa',
    'Ukraina': 'Ukraine',
    'Ả Rập Xê Út': 'Saudi Arabia',
    'Việt Nam': 'Vietnam',
};

/**
 * Lấy tên thể loại đã dịch dựa trên ngôn ngữ hiện tại
 */
export const getTranslatedGenre = (genreName: string, currentLanguage: string): string => {
    if (currentLanguage === 'en' && genreTranslations[genreName]) {
        return genreTranslations[genreName];
    }
    return genreName;
};

/**
 * Lấy tên quốc gia đã dịch dựa trên ngôn ngữ hiện tại
 */
export const getTranslatedCountry = (countryName: string, currentLanguage: string): string => {
    if (currentLanguage === 'en' && countryTranslations[countryName]) {
        return countryTranslations[countryName];
    }
    return countryName;
};
