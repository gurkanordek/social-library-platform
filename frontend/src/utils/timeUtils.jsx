export const timeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    const seconds = 1;
    const minute = 60 * seconds;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    const year = 365 * day;

    const intervals = [
        { label: 'yıl', seconds: year },
        { label: 'ay', seconds: month },
        { label: 'hafta', seconds: week },
        { label: 'gün', seconds: day },
        { label: 'saat', seconds: hour },
        { label: 'dakika', seconds: minute },
    ];

    if (diffInSeconds < minute) {
        const value = Math.floor(diffInSeconds / seconds);
        if (value < 5) return "Şimdi";
        return `${value} saniye önce`;
    }

    for (const interval of intervals) {
        const value = Math.floor(diffInSeconds / interval.seconds);
        if (value >= 1) {
            return `${value} ${interval.label} önce`;
        }
    }

    return "Az önce";
};