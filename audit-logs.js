/**
 * Audit Logs Viewer Web Component
 * 
 * A custom web component that displays audit logs from Facets Control Plane API.
 */

class AuditLogsViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Component state
    this.logs = [];
    this.currentPage = 0;
    this.pageSize = 10;
    this.totalPages = 0;
    this.isLoading = false;
    
    // Default filters
    this.filters = {
      start: this.getDefaultStartDate(),
      end: new Date().toISOString(),
      number: 0,
      size: this.pageSize
    };
    
    // Render initial UI
    this.render();
  }
  
  // Get a default start date (7 days ago)
  getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString();
  }
  
  connectedCallback() {
    this.setupEventListeners();
    this.fetchAuditLogs();
  }
  
  render() {
    const styles = `
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        color: #333;
        --primary-color: #0077cc;
        --border-color: #e0e0e0;
      }
      
      .container {
        max-width: 100%;
        margin: 0 auto;
        padding: 1rem;
      }
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      
      h2 {
        margin: 0;
        font-size: 1.5rem;
      }
      
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1rem;
        padding: 1rem;
        background-color: #f5f5f5;
        border-radius: 4px;
      }
      
      .filter-group {
        display: flex;
        flex-direction: column;
      }
      
      label {
        font-size: 0.8rem;
        margin-bottom: 0.25rem;
      }
      
      input, select {
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-size: 0.9rem;
      }
      
      button {
        background-color: var(--primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 0.5rem 1rem;
        cursor: pointer;
        font-size: 0.9rem;
      }
      
      button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }
      
      .apply-filters {
        align-self: flex-end;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1rem;
      }
      
      th, td {
        text-align: left;
        padding: 0.75rem;
        border-bottom: 1px solid var(--border-color);
      }
      
      th {
        background-color: #f5f5f5;
        font-weight: 600;
      }
      
      tr:hover {
        background-color: #f9f9f9;
      }
      
      .loading {
        display: flex;
        justify-content: center;
        padding: 2rem;
      }
      
      .error {
        color: #d32f2f;
        padding: 1rem;
        background-color: #ffebee;
        border-radius: 4px;
        margin-bottom: 1rem;
      }
      
      .empty-state {
        text-align: center;
        padding: 2rem;
        color: #757575;
      }
      
      .pagination {
        display: flex;
        justify-content: center;
        gap: 1rem;
        align-items: center;
        margin-top: 1rem;
      }
    `;
    
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="container">
        <div class="header">
          <h2>Audit Logs</h2>
        </div>
        
        <div class="filters">
          <div class="filter-group">
            <label for="start-date">From</label>
            <input type="datetime-local" id="start-date">
          </div>
          
          <div class="filter-group">
            <label for="end-date">To</label>
            <input type="datetime-local" id="end-date">
          </div>
          
          <div class="filter-group">
            <label for="stack-name">Project</label>
            <input type="text" id="stack-name" placeholder="Filter by project name">
          </div>
          
          <div class="filter-group">
            <label for="cluster-name">Environment</label>
            <input type="text" id="cluster-name" placeholder="Filter by environment name">
          </div>
          
          <div class="filter-group">
            <label for="performed-by">User</label>
            <input type="text" id="performed-by" placeholder="Filter by username">
          </div>
          
          <button class="apply-filters" id="apply-filters">Apply Filters</button>
        </div>
        
        <div class="error" id="error-message" style="display: none;"></div>
        
        <div class="loading" id="loading" style="display: none;">
          Loading audit logs...
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Target</th>
              <th>Project</th>
              <th>Environment</th>
            </tr>
          </thead>
          <tbody id="logs-table-body">
            <!-- Log entries will be populated here -->
          </tbody>
        </table>
        
        <div class="empty-state" id="empty-state" style="display: none;">
          No audit logs found matching your filters.
        </div>
        
        <div class="pagination">
          <button id="prev-page" disabled>Previous</button>
          <span id="page-info">Page 1 of 1</span>
          <button id="next-page" disabled>Next</button>
        </div>
      </div>
    `;
  }
  
  setupEventListeners() {
    // Apply filters button
    const applyFiltersBtn = this.shadowRoot.getElementById('apply-filters');
    applyFiltersBtn.addEventListener('click', () => this.applyFilters());
    
    // Pagination buttons
    const prevBtn = this.shadowRoot.getElementById('prev-page');
    const nextBtn = this.shadowRoot.getElementById('next-page');
    
    prevBtn.addEventListener('click', () => this.previousPage());
    nextBtn.addEventListener('click', () => this.nextPage());
    
    // Initialize date inputs with current values
    this.updateDateInputs();
  }
  
  updateDateInputs() {
    // Convert ISO strings to datetime-local input format
    const formatDateForInput = (isoString) => {
      const date = new Date(isoString);
      return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    };
    
    const startDateInput = this.shadowRoot.getElementById('start-date');
    const endDateInput = this.shadowRoot.getElementById('end-date');
    
    startDateInput.value = formatDateForInput(this.filters.start);
    endDateInput.value = formatDateForInput(this.filters.end);
  }
  
  async fetchAuditLogs() {
    try {
      this.setLoading(true);
      this.clearError();
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add all filters to params
      for (const [key, value] of Object.entries(this.filters)) {
        if (Array.isArray(value)) {
          // Handle array parameters
          value.forEach(item => params.append(key, item));
        } else if (value !== null && value !== undefined && value !== '') {
          // Handle scalar parameters
          params.append(key, value);
        }
      }
      
      // Make API request
      const url = `/cc-ui/v1/audit-logs?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update component state
      this.logs = data.content || [];
      this.totalPages = data.totalPages || 0;
      this.currentPage = data.number || 0;
      
      // Update UI
      this.updateLogsTable();
      this.updatePagination();
      
    } catch (error) {
      this.showError(`Failed to fetch audit logs: ${error.message}`);
      console.error('Error fetching audit logs:', error);
    } finally {
      this.setLoading(false);
    }
  }
  
  updateLogsTable() {
    const tableBody = this.shadowRoot.getElementById('logs-table-body');
    const emptyState = this.shadowRoot.getElementById('empty-state');
    
    // Clear current table contents
    tableBody.innerHTML = '';
    
    // Show empty state if no logs
    if (this.logs.length === 0) {
      emptyState.style.display = 'block';
      return;
    }
    
    // Hide empty state if we have logs
    emptyState.style.display = 'none';
    
    // Add log entries to table
    this.logs.forEach(log => {
      const row = document.createElement('tr');
      
      // Format date
      const date = new Date(log.performedAt);
      const formattedDate = date.toLocaleString();
      
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${log.performedBy || '-'}</td>
        <td>${log.entityActionLabel || log.entityAction || '-'}</td>
        <td>${log.target || '-'}</td>
        <td>${log.stackName || '-'}</td>
        <td>${log.clusterName || '-'}</td>
      `;
      
      tableBody.appendChild(row);
    });
  }
  
  updatePagination() {
    const prevBtn = this.shadowRoot.getElementById('prev-page');
    const nextBtn = this.shadowRoot.getElementById('next-page');
    const pageInfo = this.shadowRoot.getElementById('page-info');
    
    // Update page info text
    pageInfo.textContent = `Page ${this.currentPage + 1} of ${Math.max(1, this.totalPages)}`;
    
    // Update button states
    prevBtn.disabled = this.currentPage <= 0;
    nextBtn.disabled = this.currentPage >= this.totalPages - 1 || this.totalPages <= 1;
  }
  
  applyFilters() {
    // Get values from filter inputs
    const startDateInput = this.shadowRoot.getElementById('start-date');
    const endDateInput = this.shadowRoot.getElementById('end-date');
    const stackNameInput = this.shadowRoot.getElementById('stack-name');
    const clusterNameInput = this.shadowRoot.getElementById('cluster-name');
    const performedByInput = this.shadowRoot.getElementById('performed-by');
    
    // Update filters object
    this.filters = {
      // Required parameters
      start: startDateInput.value ? new Date(startDateInput.value).toISOString() : this.getDefaultStartDate(),
      end: endDateInput.value ? new Date(endDateInput.value).toISOString() : new Date().toISOString(),
      number: 0, // Reset to first page
      size: this.pageSize,
      
      // Optional filters (only add if they have values)
      ...(stackNameInput.value && { stackName: stackNameInput.value }),
      ...(clusterNameInput.value && { clusterName: clusterNameInput.value }),
      ...(performedByInput.value && { performedBy: performedByInput.value })
    };
    
    // Fetch logs with new filters
    this.fetchAuditLogs();
  }
  
  previousPage() {
    if (this.currentPage > 0) {
      this.filters.number = this.currentPage - 1;
      this.fetchAuditLogs();
    }
  }
  
  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.filters.number = this.currentPage + 1;
      this.fetchAuditLogs();
    }
  }
  
  setLoading(isLoading) {
    this.isLoading = isLoading;
    const loadingElement = this.shadowRoot.getElementById('loading');
    loadingElement.style.display = isLoading ? 'block' : 'none';
  }
  
  showError(message) {
    const errorElement = this.shadowRoot.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  clearError() {
    const errorElement = this.shadowRoot.getElementById('error-message');
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
}

// Register the custom element
customElements.define('audit-logs-viewer', AuditLogsViewer);