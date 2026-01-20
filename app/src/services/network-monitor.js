/**
 * Network Monitor Service
 * Handles network request tracking and analysis
 */

const { MapArray } = require("../utils");

class NetworkMonitorService {
  constructor() {
    this.requestIndex = 0;
  }

  /**
   * Get all requests for a window
   */
  getRequests(winId) {
    if (!winId) {
      return [];
    }
    return new MapArray(winId).all();
  }

  /**
   * Clear all requests for a window
   */
  clearRequests(winId) {
    if (!winId) {
      return;
    }
    new MapArray(winId).clear();
  }

  /**
   * Get request by index
   */
  getRequestByIndex(winId, index) {
    const requests = this.getRequests(winId);
    return requests.find(r => r.index === index) || null;
  }

  /**
   * Filter requests by criteria
   */
  filterRequests(winId, filters = {}) {
    let requests = this.getRequests(winId);

    if (filters.method) {
      requests = requests.filter(r => r.method === filters.method);
    }

    if (filters.url) {
      const urlFilter = filters.url.toLowerCase();
      requests = requests.filter(r =>
        r.url.toLowerCase().includes(urlFilter)
      );
    }

    if (filters.statusCode) {
      requests = requests.filter(r => r.statusCode === filters.statusCode);
    }

    if (filters.since) {
      requests = requests.filter(r => r.timestamp >= filters.since);
    }

    return requests;
  }

  /**
   * Get request statistics
   */
  getRequestStats(winId) {
    const requests = this.getRequests(winId);

    const stats = {
      total: requests.length,
      methods: {},
      domains: {},
      statusCodes: {},
      timeRange: null
    };

    if (requests.length === 0) {
      return stats;
    }

    // Calculate time range
    const timestamps = requests.map(r => r.timestamp).sort();
    stats.timeRange = {
      start: timestamps[0],
      end: timestamps[timestamps.length - 1],
      duration: timestamps[timestamps.length - 1] - timestamps[0]
    };

    // Count methods
    requests.forEach(req => {
      stats.methods[req.method] = (stats.methods[req.method] || 0) + 1;

      // Extract domain
      try {
        const url = new URL(req.url);
        stats.domains[url.hostname] = (stats.domains[url.hostname] || 0) + 1;
      } catch (e) {
        stats.domains['invalid'] = (stats.domains['invalid'] || 0) + 1;
      }

      // Count status codes (if available)
      if (req.statusCode) {
        stats.statusCodes[req.statusCode] = (stats.statusCodes[req.statusCode] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Export requests to different formats
   */
  exportRequests(winId, format = 'json') {
    const requests = this.getRequests(winId);

    switch (format) {
      case 'json':
        return JSON.stringify(requests, null, 2);

      case 'csv':
        if (requests.length === 0) return '';

        const headers = Object.keys(requests[0]).join(',');
        const rows = requests.map(req =>
          Object.values(req).map(val =>
            typeof val === 'object' ? JSON.stringify(val) : String(val)
          ).join(',')
        );

        return [headers, ...rows].join('\n');

      case 'har':
        // Simplified HAR format
        return JSON.stringify({
          log: {
            version: '1.2',
            creator: { name: 'Electron Headless Browser', version: '1.0.0' },
            entries: requests.map(req => ({
              startedDateTime: new Date(req.timestamp).toISOString(),
              request: {
                method: req.method,
                url: req.url,
                headers: req.requestHeaders ? Object.entries(req.requestHeaders).map(([name, value]) => ({ name, value })) : []
              }
            }))
          }
        }, null, 2);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

module.exports = new NetworkMonitorService();