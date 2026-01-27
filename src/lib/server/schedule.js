import { notion, DATABASE_IDS, extractPlainText } from './notion.js';

/**
 * @typedef {Object} ScheduleEvent
 * @property {string} id - Page ID
 * @property {string} title - Event title
 * @property {string} date - Event date (ISO string)
 * @property {string} endDate - Event end date if range
 * @property {string} description - Event description (Category/Type)
 * @property {string} location - Event location
 * @property {boolean} isUpcoming - Whether the event is in the future
 * @property {boolean} isPast - Whether the event is in the past
 */

/**
 * @typedef {Object} MonthGroup
 * @property {string} month - Month key (YYYY-MM format)
 * @property {string} label - Human readable month label
 * @property {ScheduleEvent[]} events - Events in this month
 */

/**
 * Get all future events grouped by split (Next Upcoming + Rest grouped by month)
 * @returns {Promise<{nextUp: ScheduleEvent|null, monthlyEvents: MonthGroup[]}>}
 */
export async function getFutureSchedule() {
    try {
        const today = new Date().toISOString().split('T')[0];

        let response;
        try {
            response = await notion.databases.query({
                database_id: DATABASE_IDS.SCHEDULE,
                filter: {
                    and: [
                        {
                            property: 'Web公開',
                            select: {
                                equals: '公開'
                            }
                        },
                        {
                            property: '日付',
                            date: {
                                on_or_after: today
                            }
                        }
                    ]
                },
                sorts: [
                    {
                        property: '日付',
                        direction: 'ascending'
                    }
                ],
                page_size: 100
            });
        } catch {
            response = await notion.databases.query({
                database_id: DATABASE_IDS.SCHEDULE,
                filter: {
                    property: '日付',
                    date: {
                        on_or_after: today
                    }
                },
                sorts: [
                    {
                        property: '日付',
                        direction: 'ascending'
                    }
                ],
                page_size: 100
            });
        }

        const now = new Date();
        const events = response.results.map((page) => parseScheduleEvent(page, now));

        const nextUp = events[0] || null;
        const rest = events.slice(1);

        // Group rest by month
        const grouped = new Map();
        for (const event of rest) {
            if (!event.date) continue;
            const monthKey = event.date.substring(0, 7); // YYYY-MM
            if (!grouped.has(monthKey)) {
                const date = new Date(event.date);
                grouped.set(monthKey, {
                    month: monthKey,
                    // Use Japanese month format: 2026.02
                    label: date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit' }).replace(/\//g, '.'),
                    events: []
                });
            }
            grouped.get(monthKey).events.push(event);
        }

        return {
            nextUp,
            monthlyEvents: Array.from(grouped.values())
        };
    } catch (error) {
        console.error('Error fetching future schedule:', error);
        return { nextUp: null, monthlyEvents: [] };
    }
}

/**
 * Get past events grouped by month
 * @returns {Promise<MonthGroup[]>}
 */
export async function getPastEventsByMonth() {
    try {
        const today = new Date().toISOString().split('T')[0];

        let response;
        try {
            response = await notion.databases.query({
                database_id: DATABASE_IDS.SCHEDULE,
                filter: {
                    and: [
                        {
                            property: 'Web公開',
                            select: {
                                equals: '公開'
                            }
                        },
                        {
                            property: '日付',
                            date: {
                                before: today
                            }
                        }
                    ]
                },
                sorts: [
                    {
                        property: '日付',
                        direction: 'descending'
                    }
                ]
            });
        } catch {
            response = await notion.databases.query({
                database_id: DATABASE_IDS.SCHEDULE,
                filter: {
                    property: '日付',
                    date: {
                        before: today
                    }
                },
                sorts: [
                    {
                        property: '日付',
                        direction: 'descending'
                    }
                ]
            });
        }

        const now = new Date();
        const events = response.results.map((page) => parseScheduleEvent(page, now));

        const grouped = new Map();
        for (const event of events) {
            if (!event.date) continue;
            const monthKey = event.date.substring(0, 7); // YYYY-MM
            if (!grouped.has(monthKey)) {
                const date = new Date(event.date);
                grouped.set(monthKey, {
                    month: monthKey,
                    label: date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }),
                    events: []
                });
            }
            grouped.get(monthKey).events.push(event);
        }

        return Array.from(grouped.values());
    } catch (error) {
        console.error('Error fetching past events:', error);
        return [];
    }
}

/**
 * Parse Notion page to ScheduleEvent object
 * Using actual Japanese property names: 名前, 日付, 種類
 * @param {any} page
 * @param {Date} now
 * @returns {ScheduleEvent}
 */
function parseScheduleEvent(page, now) {
    const props = page.properties;
    // DB uses 日付 for date
    const dateProperty = props?.日付?.date;
    const eventDate = dateProperty?.start || '';
    const eventDateTime = eventDate ? new Date(eventDate) : null;
    const isUpcoming = eventDateTime ? eventDateTime >= now : false;
    const isPast = eventDateTime ? eventDateTime < now : false;

    return {
        id: page.id,
        // DB uses 名前 as title
        title: extractPlainText(props?.名前?.title) || '',
        date: eventDate,
        endDate: dateProperty?.end || '',
        // No description property, could use 種類
        description: props?.種類?.select?.name || '',
        location: '',
        isUpcoming,
        isPast
    };
}
