# Audit Logs Viewer Web Component

A custom web component for viewing audit logs in Facets.cloud.

## Overview

This web component allows users to view and filter audit logs directly within the Facets.cloud interface. It's built using standard Web Components APIs and requires no external dependencies.

## Features

- Display audit logs in a tabular format
- Filter logs by date range, project name, environment name, and user
- Pagination support for navigating through large sets of logs
- Responsive design that works on all device sizes

## Installation

To use this web component in Facets.cloud:

1. Navigate to Organizational Settings in Facets
2. Select "Web Component" from the menu
3. Click "Add Component"
4. Fill in the following details:
   - Name: `audit-logs-viewer`
   - Remote URL: `https://anujhydrabadi.github.io/audit-web-component/audit-logs.js`
   - Icon URL: (Provide an appropriate icon URL)
   - Enable the component
   - Add an appropriate tooltip

## Development

### Prerequisites

- Basic knowledge of HTML, CSS, and JavaScript
- Understanding of Web Components
- Access to Facets.cloud for testing

### Local Development

1. Clone this repository
2. Open the index.html file in a browser
3. For API testing, you'll need to be logged into Facets in another tab

### Deployment

This component is hosted on GitHub Pages. To deploy changes:

1. Push changes to the main branch
2. GitHub Actions will automatically deploy to GitHub Pages

## API Usage

The component uses the following Facets Control Plane API:

- Endpoint: `/cc-ui/v1/audit-logs`
- Method: GET
- Parameters:
  - `start` (required): Start date for logs (ISO format)
  - `end`: End date for logs (ISO format)
  - `number`: Page number (default: 0)
  - `size`: Page size (default: 10)
  - `stackName`: Filter by project name
  - `clusterName`: Filter by environment name
  - `performedBy`: Filter by username

## License

[MIT License](LICENSE)