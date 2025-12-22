// dashboard.js - Collection analytics and management dashboard
class CollectionDashboard {
    constructor() {
        this.data = {
            artifacts: [],
            provenance: {},
            conservation: {},
            activity: []
        };

        this.filters = {
            dateRange: 'all',
            category: 'all',
            status: 'all'
        };

        this.charts = {};
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadData();
        this.renderDashboard();
        this.initCharts();
        this.hideLoading();

        // Auto-refresh every 5 minutes
        setInterval(() => this.refreshData(), 300000);
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-section').forEach(link => {
            link.addEventListener('click', (e) => {
                if (link.hash && link.hash.startsWith('#')) {
                    e.preventDefault();
                    this.switchSection(link.hash.substring(1));
                }
            });
        });

        // Date filter
        const dateFilter = document.getElementById('date-filter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.filters.dateRange = e.target.value;
                this.updateDashboard();
            });
        }

        // Buttons
        const refreshBtn = document.querySelector('[data-action="refresh"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }

        const exportBtn = document.querySelector('[data-action="export"]');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportReport();
            });
        }

        // Chart controls
        document.querySelectorAll('[data-action="chart-fullscreen"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.chart-card');
                if (card) {
                    this.toggleFullscreenChart(card);
                }
            });
        });
    }

    async loadData() {
        try {
            // In production, these would be API calls
            const [artifacts, provenance, conservation, activity] = await Promise.all([
                this.fetchArtifacts(),
                this.fetchProvenance(),
                this.fetchConservation(),
                this.fetchActivity()
            ]);

            this.data = { artifacts, provenance, conservation, activity };
            this.updateLastUpdated();

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showError('Failed to load dashboard data. Using sample data.');
            this.loadSampleData();
        }
    }

    async fetchArtifacts() {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(this.generateSampleArtifacts(1247));
            }, 300);
        });
    }

    async fetchProvenance() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(this.generateSampleProvenance());
            }, 300);
        });
    }

    async fetchConservation() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(this.generateSampleConservation());
            }, 300);
        });
    }

    async fetchActivity() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(this.generateSampleActivity());
            }, 300);
        });
    }

    loadSampleData() {
        this.data = {
            artifacts: this.generateSampleArtifacts(1247),
            provenance: this.generateSampleProvenance(),
            conservation: this.generateSampleConservation(),
            activity: this.generateSampleActivity()
        };
    }

    generateSampleArtifacts(count) {
        const categories = ['Archaeological', 'Historical', 'Personal Effects'];
        const eras = ['Prehistoric', 'Ancient', 'Medieval', 'Renaissance', 'Industrial', 'Modern'];
        const conditions = ['Excellent', 'Good', 'Fair', 'Poor'];

        return Array.from({ length: count }, (_, i) => ({
            id: `FW-ARC-${String(i + 1).padStart(4, '0')}`,
            title: `Artifact ${i + 1}`,
            category: categories[Math.floor(Math.random() * categories.length)],
            era: eras[Math.floor(Math.random() * eras.length)],
            condition: conditions[Math.floor(Math.random() * conditions.length)],
            provenanceComplete: Math.random() > 0.3,
            acquisitionDate: this.randomPastDate(3650), // Last 10 years
            insuredValue: Math.floor(Math.random() * 100000) + 1000
        }));
    }

    generateSampleProvenance() {
        return {
            complete: 892,
            partial: 248,
            gaps: 107,
            verified: 1104,
            pending: 98,
            flagged: 45
        };
    }

    generateSampleConservation() {
        return {
            excellent: 748,
            good: 374,
            fair: 87,
            poor: 38,
            treatments: this.generateSampleTreatments()
        };
    }

    generateSampleTreatments() {
        return Array.from({ length: 8 }, (_, i) => ({
            id: `TREAT-${i + 1}`,
            artifactId: `FW-ARC-${String(Math.floor(Math.random() * 1247) + 1).padStart(4, '0')}`,
            type: ['Cleaning', 'Stabilization', 'Repair', 'Analysis'][Math.floor(Math.random() * 4)],
            priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
            scheduled: this.randomFutureDate(90), // Next 90 days
            estimatedCost: Math.floor(Math.random() * 5000) + 500
        }));
    }

    generateSampleActivity() {
        const activities = ['Added', 'Updated', 'Flagged', 'Verified', 'Conserved'];
        const artifacts = this.data.artifacts && this.data.artifacts.length > 0
            ? this.data.artifacts
            : this.generateSampleArtifacts(10);

        return Array.from({ length: 15 }, (_, i) => ({
            id: `ACT-${i + 1}`,
            type: activities[Math.floor(Math.random() * activities.length)],
            artifactId: artifacts[Math.floor(Math.random() * artifacts.length)].id,
            description: `${activities[Math.floor(Math.random() * activities.length)]} artifact record`,
            user: ['Curator', 'Archivist', 'Conservator', 'Researcher'][Math.floor(Math.random() * 4)],
            timestamp: this.randomPastDate(7), // Last 7 days
            details: 'Details about this activity...'
        }));
    }

    randomPastDate(days) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * days));
        return date.toISOString();
    }

    randomFutureDate(days) {
        const date = new Date();
        date.setDate(date.getDate() + Math.floor(Math.random() * days) + 1);
        return date.toISOString();
    }

    renderDashboard() {
        this.updateSummaryStats();
        this.updateActivityFeed();
        this.updateProvenanceTable();
        this.updateTreatmentSchedule();
    }

    updateSummaryStats() {
        const stats = this.calculateSummaryStats();

        // Update sidebar
        const totalItemsEl = document.getElementById('total-items');
        const totalValueEl = document.getElementById('total-value');
        if (totalItemsEl) totalItemsEl.textContent = stats.totalItems.toLocaleString();
        if (totalValueEl) totalValueEl.textContent = `$${stats.totalValue.toLocaleString()}`;

        // Update header bar
        const activeItemsEl = document.getElementById('active-items');
        const pendingActionsEl = document.getElementById('pending-actions');
        const avgAgeEl = document.getElementById('avg-age');
        const completionRateEl = document.getElementById('completion-rate');

        if (activeItemsEl) activeItemsEl.textContent = stats.activeItems.toLocaleString();
        if (pendingActionsEl) pendingActionsEl.textContent = stats.pendingActions;
        if (avgAgeEl) avgAgeEl.textContent = stats.avgAge.toFixed(1);
        if (completionRateEl) completionRateEl.textContent = `${stats.completionRate}%`;

        // Update metric cards
        const totalArtifactsMetric = document.querySelector('[data-metric="total-artifacts"] .metric-value');
        if (totalArtifactsMetric) {
            totalArtifactsMetric.textContent = stats.totalItems.toLocaleString();
        }

        const provenanceCompleteMetric = document.querySelector('[data-metric="provenance-complete"] .metric-value');
        const provenanceFooter = document.querySelector('[data-metric="provenance-complete"] .metric-footer span');
        if (provenanceCompleteMetric) provenanceCompleteMetric.textContent = `${stats.completionRate}%`;
        if (provenanceFooter) provenanceFooter.textContent = `${stats.itemsNeedingDoc} items need documentation`;
    }

    calculateSummaryStats() {
        const artifacts = this.data.artifacts;

        return {
            totalItems: artifacts.length,
            totalValue: artifacts.reduce((sum, item) => sum + item.insuredValue, 0),
            activeItems: artifacts.filter(item => item.provenanceComplete).length,
            pendingActions: this.data.provenance.pending + this.data.provenance.flagged,
            avgAge: this.calculateAverageAge(artifacts),
            completionRate: Math.round((artifacts.filter(item => item.provenanceComplete).length / artifacts.length) * 100),
            itemsNeedingDoc: artifacts.filter(item => !item.provenanceComplete).length
        };
    }

    calculateAverageAge(artifacts) {
        const now = new Date();
        const ages = artifacts.map(item => {
            const acquisition = new Date(item.acquisitionDate);
            return (now - acquisition) / (1000 * 60 * 60 * 24 * 365.25); // Convert to years
        });

        return ages.reduce((sum, age) => sum + age, 0) / Math.max(ages.length, 1);
    }

    updateActivityFeed() {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        const recent = this.data.activity.slice(0, 5);

        container.innerHTML = recent.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type.toLowerCase()}">
                    ${this.getActivityIcon(activity.type)}
                </div>
                <div class="activity-content">
                    <h4 class="activity-title">${activity.type}: ${activity.artifactId}</h4>
                    <p class="activity-description">${activity.description}</p>
                    <div class="activity-meta">
                        <span>By: ${activity.user}</span>
                        <span>${this.formatRelativeTime(activity.timestamp)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        const icons = {
            'Added': '➕',
            'Updated': '✏️',
            'Flagged': '🚩',
            'Verified': '✅',
            'Conserved': '🔬'
        };
        return icons[type] || '📝';
    }

    formatRelativeTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    }

    updateProvenanceTable() {
        const container = document.getElementById('provenance-gaps-table');
        if (!container) return;

        const gaps = this.data.artifacts
            .filter(item => !item.provenanceComplete)
            .slice(0, 10);

        container.innerHTML = gaps.map(item => {
            const priority = this.getRandomPriority();
            const gapPeriod = this.getRandomGapPeriod();
            return `
            <tr>
                <td><code>${item.id}</code></td>
                <td>${item.title}</td>
                <td>${item.era}</td>
                <td>${gapPeriod}</td>
                <td><span class="priority ${priority}">${priority.toUpperCase()}</span></td>
                <td><button class="btn btn-sm" data-action="review-gap" data-id="${item.id}">Review</button></td>
            </tr>`;
        }).join('');

        // Add event listeners to review buttons
        container.querySelectorAll('[data-action="review-gap"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.reviewProvenanceGap(id);
            });
        });
    }

    getRandomGapPeriod() {
        const periods = ['1920-1940', '1950-1960', '1970-1980', '1990-2000', 'Unknown'];
        return periods[Math.floor(Math.random() * periods.length)];
    }

    getRandomPriority() {
        const priorities = ['high', 'medium', 'low'];
        return priorities[Math.floor(Math.random() * priorities.length)];
    }

    updateTreatmentSchedule() {
        const container = document.getElementById('treatment-schedule');
        if (!container) return;

        const treatments = this.data.conservation.treatments.slice(0, 5);

        container.innerHTML = treatments.map(treatment => {
            const priorityClass = treatment.priority.toLowerCase();
            return `
            <div class="schedule-item ${priorityClass === 'high' ? 'critical' : ''}">
                <div>
                    <strong>${treatment.artifactId}</strong>
                    <div style="font-size: 0.85rem; color: #666;">
                        ${treatment.type} • ${new Date(treatment.scheduled).toLocaleDateString()}
                    </div>
                </div>
                <span class="priority ${priorityClass}">${treatment.priority}</span>
            </div>`;
        }).join('');
    }

    updateLastUpdated() {
        const element = document.getElementById('last-updated-time');
        if (element) {
            element.textContent = new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
            element.dateTime = new Date().toISOString();
        }
    }

    initCharts() {
        // Era distribution chart
        if (typeof ApexCharts !== 'undefined') {
            this.initEraChart();
            this.initProvenanceChainChart();
            this.initMiniCharts();
        }
    }

    initEraChart() {
        const eraCounts = this.countByEra();

        this.charts.era = new ApexCharts(document.querySelector("#era-chart"), {
            series: Object.values(eraCounts),
            chart: {
                type: 'donut',
                height: '100%'
            },
            labels: Object.keys(eraCounts),
            colors: ['#1a2d1a', '#D4AF37', '#8a8d8f', '#9ca3af', '#6b7280', '#374151'],
            legend: {
                position: 'bottom'
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '70%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Total Artifacts',
                                formatter: () => this.data.artifacts.length.toString()
                            }
                        }
                    }
                }
            },
            responsive: [{
                breakpoint: 768,
                options: {
                    chart: {
                        height: 300
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        });

        this.charts.era.render();
    }

    countByEra() {
        const eras = ['Prehistoric', 'Ancient', 'Medieval', 'Renaissance', 'Industrial', 'Modern'];
        const counts = {};

        eras.forEach(era => {
            counts[era] = this.data.artifacts.filter(item => item.era === era).length;
        });

        return counts;
    }

    initProvenanceChainChart() {
        const provenanceData = this.data.provenance;

        this.charts.provenance = new ApexCharts(document.querySelector("#provenance-chain-chart"), {
            series: [{
                name: 'Items',
                data: [
                    provenanceData.complete,
                    provenanceData.partial,
                    provenanceData.gaps
                ]
            }],
            chart: {
                type: 'bar',
                height: '100%'
            },
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    horizontal: true,
                }
            },
            dataLabels: {
                enabled: true
            },
            xaxis: {
                categories: ['Complete', 'Partial', 'Gaps'],
                title: {
                    text: 'Number of Items'
                }
            },
            yaxis: {
                title: {
                    text: 'Provenance Status'
                }
            },
            colors: ['#10b981', '#f59e0b', '#ef4444']
        });

        this.charts.provenance.render();
    }

    initMiniCharts() {
        // Mini chart for provenance completion
        this.charts.provenanceMini = new ApexCharts(document.querySelector("#provenance-chart"), {
            series: [94, 6],
            chart: {
                type: 'radialBar',
                height: 60,
                sparkline: {
                    enabled: true
                }
            },
            plotOptions: {
                radialBar: {
                    hollow: {
                        size: '50%'
                    },
                    dataLabels: {
                        show: false
                    }
                }
            },
            colors: ['#10b981'],
            stroke: {
                lineCap: 'round'
            }
        });

        this.charts.provenanceMini.render();

        // Sparkline for acquisitions
        const sparklineData = this.generateSparklineData();

        this.charts.acquisitionSparkline = new ApexCharts(document.querySelector("#acquisition-sparkline"), {
            series: [{
                data: sparklineData
            }],
            chart: {
                type: 'area',
                height: 40,
                sparkline: {
                    enabled: true
                }
            },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            fill: {
                opacity: 0.3
            },
            colors: ['#D4AF37'],
            tooltip: {
                fixed: {
                    enabled: false
                }
            }
        });

        this.charts.acquisitionSparkline.render();
    }

    generateSparklineData() {
        return Array.from({ length: 12 }, () => Math.floor(Math.random() * 30) + 5);
    }

    switchSection(sectionId) {
        // Update navigation
        document.querySelectorAll('.nav-section').forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionId);
        });

        // Update sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });

        // Update header
        const sectionHeading = document.querySelector(`#${sectionId} h2`);
        if (sectionHeading) {
            document.getElementById('current-section').textContent = sectionHeading.textContent;
        }

        // Update URL hash
        if (sectionId) {
            window.location.hash = sectionId;
        }
    }

    async refreshData() {
        const refreshBtn = document.querySelector('[data-action="refresh"]');
        const originalText = refreshBtn ? refreshBtn.innerHTML : '';

        if (refreshBtn) {
            refreshBtn.innerHTML = '<span class="btn-icon">⏳</span> Refreshing...';
            refreshBtn.disabled = true;
        }

        try {
            await this.loadData();
            this.updateDashboard();
            this.showNotification('Data refreshed successfully');
        } catch (error) {
            this.showError('Failed to refresh data');
        } finally {
            if (refreshBtn) {
                refreshBtn.innerHTML = originalText;
                refreshBtn.disabled = false;
            }
        }
    }

    updateDashboard() {
        this.renderDashboard();

        // Update charts if they exist
        if (this.charts.era) {
            this.charts.era.updateSeries(Object.values(this.countByEra()));
        }
    }

    async exportReport() {
        const date = new Date().toISOString().split('T')[0];

        const csv = this.generateCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `fort-wolters-dashboard-${date}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('Report exported successfully');
    }

    generateCSV() {
        const headers = ['ID', 'Title', 'Category', 'Era', 'Condition', 'Provenance Complete', 'Insured Value'];
        const rows = this.data.artifacts.map(item => [
            item.id,
            item.title,
            item.category,
            item.era,
            item.condition,
            item.provenanceComplete ? 'Yes' : 'No',
            `$${item.insuredValue}`
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    reviewProvenanceGap(id) {
        const artifact = this.data.artifacts.find(item => item.id === id);
        if (artifact) {
            this.showNotification(`Reviewing provenance gap for ${id}`);
            // In production, this would open a detailed review interface
            console.log('Reviewing artifact:', artifact);
        }
    }

    toggleFullscreenChart(chartCard) {
        chartCard.classList.toggle('fullscreen');

        if (chartCard.classList.contains('fullscreen')) {
            document.body.style.overflow = 'hidden';
            chartCard.style.position = 'fixed';
            chartCard.style.zIndex = '9999';
            chartCard.style.inset = '0';
            chartCard.style.margin = '0';
            chartCard.style.width = '100vw';
            chartCard.style.height = '100vh';
        } else {
            document.body.style.overflow = '';
            chartCard.style.position = '';
            chartCard.style.zIndex = '';
            chartCard.style.inset = '';
            chartCard.style.margin = '';
            chartCard.style.width = '';
            chartCard.style.height = '';
        }
    }

    hideLoading() {
        document.body.classList.add('dashboard-loaded');
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'dashboard-notification';
        notification.innerHTML = `
            <span class="notification-icon">✅</span>
            <span class="notification-text">${message}</span>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showError(message) {
        const error = document.createElement('div');
        error.className = 'dashboard-error';
        error.innerHTML = `
            <span class="error-icon">⚠️</span>
            <span class="error-text">${message}</span>
        `;

        error.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(error);

        setTimeout(() => {
            error.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => error.remove(), 300);
        }, 5000);
    }
}

// Initialize dashboard when DOM is ready
const startDashboard = () => {
    // Auth gate
    if (typeof AuthManager !== 'undefined') {
        if (!AuthManager.currentUser) {
            AuthManager.redirectToLogin('Please log in to access the dashboard');
            return;
        }
        if (!AuthManager.hasPermission('view:dashboard')) {
            alert('You do not have permission to access the dashboard.');
            window.location.href = 'index.html';
            return;
        }
    }
    new CollectionDashboard();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startDashboard);
} else {
    startDashboard();
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
