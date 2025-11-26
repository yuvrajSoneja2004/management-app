import { useMemo } from 'react';

// Generate consistent color for user based on their ID
const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
};

const Avatar = ({ username, userId, size = 'md', className = '' }) => {
    const initials = useMemo(() => {
        if (!username) return '?';
        return username.charAt(0).toUpperCase();
    }, [username]);

    const bgColor = useMemo(() => {
        return stringToColor(userId || username || 'default');
    }, [userId, username]);

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base'
    };

    return (
        <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white ${className}`}
            style={{ backgroundColor: bgColor }}
            title={username}
        >
            {initials}
        </div>
    );
};

export default Avatar;
