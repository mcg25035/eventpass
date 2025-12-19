// Mock Data Service
// Simulates a backend database for activities and badges

export interface Badge {
    id: string;
    name: string;
    type: string;
    limit: string;
    icon: string;
}

export interface Activity {
    id: string;
    name: string;
    badges: Badge[];
}

// Initial Data
const mockActivities: { [key: string]: Activity } = {
    '1': {
        id: '1',
        name: 'Activity 1',
        badges: [
            { id: '101', name: 'Participation', type: 'Record', limit: '0', icon: '🏅' }
        ]
    },
    '2': {
        id: '2',
        name: 'Activity 2',
        badges: []
    },
    '3': {
        id: '3',
        name: 'Activity 3',
        badges: []
    },
};

export const MockData = {
    getActivities: () => Object.values(mockActivities),

    getActivity: (id: string) => mockActivities[id],

    getBadges: (activityId: string) => {
        return mockActivities[activityId]?.badges || [];
    },

    addBadge: (activityId: string, badge: Omit<Badge, 'id'>) => {
        const activity = mockActivities[activityId];
        if (activity) {
            const newBadge = { ...badge, id: Math.random().toString(36).substr(2, 9) };
            activity.badges.push(newBadge);
            return newBadge;
        }
        return null;
    },

    updateBadge: (activityId: string, badgeId: string, updates: Partial<Badge>) => {
        const activity = mockActivities[activityId];
        if (activity) {
            const index = activity.badges.findIndex(b => b.id === badgeId);
            if (index !== -1) {
                activity.badges[index] = { ...activity.badges[index], ...updates };
                return activity.badges[index];
            }
        }
        return null;
    }
};
