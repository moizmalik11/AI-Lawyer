import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dashboardService } from '../services/dashboard.service';
import { useAuth } from '../context/AuthContext';

export const useDashboardData = () => {
    const { user } = useAuth();
    const userName = user?.name || user?.username || 'Client';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const fetchAllDashboardData = async () => {
        let statsData = {
            aiConsultations: 0,
            contractsAnalyzed: 0,
            judgmentsViewed: 0,
            hoursSaved: "0m"
        };
        let experienceData = {
            averageRating: 0,
            totalRatings: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
        let systemData = {
            databaseIndexing: 100,
            usageQuotaPercentage: 10,
            statusMessage: "Your legal assistant is fully operational and ready to assist."
        };

        try {
            // 1. Fetch real stats from backend
            try {
                const fetchedStats = await dashboardService.getStats();
                if (fetchedStats) {
                    statsData = {
                        aiConsultations: fetchedStats.aiConsultations || 0,
                        contractsAnalyzed: fetchedStats.contractsAnalyzed || 0,
                        judgmentsViewed: fetchedStats.judgmentsViewed || 0,
                        hoursSaved: fetchedStats.hoursSaved || "0m"
                    };
                }
            } catch (err) {
                console.warn("Failed to fetch dashboard stats:", err);
            }

            // 2. Fetch experience / rating data
            try {
                const expData = await dashboardService.getExperience();
                if (expData) {
                    experienceData = {
                        averageRating: expData.averageRating || 0,
                        totalRatings: expData.totalRatings || 0,
                        ratingDistribution: expData.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                    };
                }
            } catch (err) {
                console.warn("Failed to fetch experience data:", err);
            }

            // 3. Fetch System Status
            try {
                const sysStat = await dashboardService.getSystemStatus();
                if (sysStat) systemData = sysStat;
            } catch (err) {
                console.warn("System status fallback.");
            }

            return { stats: statsData, experience: experienceData, systemStatus: systemData };

        } catch (error) {
            console.error("Dashboard DB fetch error:", error);
            throw new Error("Failed to load dashboard data");
        }
    };

    const { data, isLoading, isError } = useQuery({
        queryKey: ['dashboardData', user?.id],
        queryFn: fetchAllDashboardData,
        staleTime: 5 * 60 * 1000, 
        onError: () => toast.error("Failed to load dashboard data.")
    });

    return {
        userName,
        getGreeting,
        currentDate,
        stats: data?.stats || { aiConsultations: 0, contractsAnalyzed: 0, judgmentsViewed: 0, hoursSaved: "0m" },
        experience: data?.experience || { averageRating: 0, totalRatings: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
        systemStatus: data?.systemStatus || { databaseIndexing: 100, usageQuotaPercentage: 0, statusMessage: "Establishing secure connection..." },
        isLoading
    };
};