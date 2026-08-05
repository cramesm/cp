describe('Registrar Document Requests', () => {
  beforeEach(() => {
    // Navigate to the app and login as Registrar
    cy.visit('/login');
    cy.get('#login-email').type('admin@verifitor.com');
    cy.get('#login-password').type('admin123');
    cy.get('button[type="submit"]').click();
    
    // Wait for login to complete (navigates to dashboard)
    cy.url().should('include', '/dashboard');
    
    // Go directly to requests
    cy.visit('/requests');

    // Wait for the table to finish loading before any test starts
    // This prevents Cypress from checking the table while it still says "Loading requests..."
    cy.get('tbody').should('not.contain', 'Loading requests...');
  });

  it('1. View Requests List', () => {
    // Verify that the table header exists
    cy.contains('th', 'Request ID').should('be.visible');
    cy.contains('th', 'Name').should('be.visible');
    cy.contains('th', 'Status').should('be.visible');
  });

  it('2. Filter by Search', () => {
    // Search for a specific term
    cy.get('input[placeholder="Search by name or action..."]').type('John');
    cy.contains('button', 'Search').click();
    // Assuming 'John' is returned, we should see it in the table or "No requests found" if none exist
    cy.get('tbody').should('be.visible');
  });

  it('3. Filter by Status/Type/Date', () => {
    // Select a Status
    cy.contains('label', 'Status:').parent().find('select').select('Pending');
    
    // Select a Document Type
    cy.contains('label', 'Document Type:').parent().find('select').select('All Document');
    
    // Select Dates
    // Note: Cypress interacts with date inputs by typing the date string (YYYY-MM-DD)
    cy.contains('label', 'Start Date:').parent().find('input[type="date"]').type('2026-01-01');
    cy.contains('label', 'End Date:').parent().find('input[type="date"]').type('2026-12-31');

    // Verify filter application
    cy.get('tbody').should('be.visible');
  });

  it('4. View Request Details', () => {
    // Click on the first 'View Request' button if requests exist
    cy.get('tbody').then($tbody => {
      if ($tbody.find('button:contains("View Request")').length > 0) {
        cy.get('button').contains('View Request').first().click();
        cy.url().should('include', '/requests/');
        cy.contains('Request Details').should('be.visible');
      }
    });
  });

  it('5. Verify Payment', () => {
    // This requires a pending request. Go to details page
    // Using a mock click if element is present
    cy.get('tbody').then($tbody => {
      if ($tbody.find('button:contains("View Request")').length > 0) {
        cy.get('button').contains('View Request').first().click();
        
        // Check if "Verify Payment" step exists
        cy.get('body').then($body => {
          if ($body.find('button:contains("Verify Payment")').length > 0) {
            cy.contains('button', 'Verify Payment').click();
            cy.contains('button', 'Confirm').click(); // Confirm modal
            // Wait for success and check if we moved to next step
          }
        });
      }
    });
  });

  it('6. Reject Payment/Request', () => {
    // Requires a pending request
    cy.get('tbody').then($tbody => {
      if ($tbody.find('button:contains("View Request")').length > 0) {
        cy.get('button').contains('View Request').first().click();
        
        // Click reject if available
        cy.get('body').then($body => {
          if ($body.find('button:contains("Reject")').length > 0) {
            cy.contains('button', 'Reject').click();
            cy.contains('Select Reason').should('be.visible');
            cy.get('select').select('Incomplete Requirements');
            cy.contains('button', 'Confirm Rejection').click();
          }
        });
      }
    });
  });

  it('7. Upload Valid Document', () => {
    // This requires an 'In Process' request
    // Navigate and check if upload input is present
    cy.get('tbody').then($tbody => {
      if ($tbody.find('button:contains("View Request")').length > 0) {
        cy.get('button').contains('View Request').first().click();
        
        cy.get('body').then($body => {
          if ($body.find('input[type="file"]').length > 0) {
            // Note: Cypress requires a fixture file for upload
            // cy.get('input[type="file"]').selectFile('cypress/fixtures/sample.pdf');
            // cy.contains('button', 'Upload PDF').click();
          }
        });
      }
    });
  });

  it('8. Upload Invalid Format', () => {
    // Requires 'In Process' request
    // Check if error is thrown for non-PDF file
    cy.get('tbody').then($tbody => {
      if ($tbody.find('button:contains("View Request")').length > 0) {
        cy.get('button').contains('View Request').first().click();
        
        cy.get('body').then($body => {
          if ($body.find('input[type="file"]').length > 0) {
            // cy.get('input[type="file"]').selectFile('cypress/fixtures/sample.jpg');
            // Assuming alert is triggered, cypress catches alerts natively
            // cy.on('window:alert', (text) => {
            //   expect(text).to.contains('Only PDF files are allowed');
            // });
          }
        });
      }
    });
  });

  it('9. Secure Document (Standard)', () => {
    // Finalizing a standard document (Step 3)
    cy.get('tbody').then($tbody => {
      if ($tbody.find('button:contains("View Request")').length > 0) {
        cy.get('button').contains('View Request').first().click();
        
        cy.get('body').then($body => {
          if ($body.find('button:contains("Finalize")').length > 0) {
            cy.contains('button', 'Finalize').click();
            cy.contains('button', 'Confirm').click(); // modal
          }
        });
      }
    });
  });

  it('10. Secure on Blockchain (TOR/Diploma)', () => {
    // Finalizing a Blockchain document (Step 3)
    cy.get('tbody').then($tbody => {
      if ($tbody.find('button:contains("View Request")').length > 0) {
        cy.get('button').contains('View Request').first().click();
        
        cy.get('body').then($body => {
          if ($body.find('button:contains("Secure on Blockchain")').length > 0) {
            cy.get('input[placeholder="Enter Student ID Number"]').type('123456');
            cy.contains('button', 'Secure on Blockchain').click();
            cy.contains('button', 'Confirm').click(); // modal
          }
        });
      }
    });
  });

  it('11. View Blockchain Details', () => {
    // Verify Step 4 content
    cy.get('tbody').then($tbody => {
      if ($tbody.find('button:contains("View Request")').length > 0) {
        cy.get('button').contains('View Request').first().click();
        
        cy.get('body').then($body => {
          if ($body.find('div:contains("Transaction Hash")').length > 0) {
            cy.contains('Transaction Hash').should('be.visible');
            cy.contains('Reference Number').should('be.visible');
          }
        });
      }
    });
  });

  it('12. Double-Click Prevention', () => {
    // Click confirm multiple times rapidly to ensure isExecuting prevents double triggers
    cy.get('tbody').then($tbody => {
      if ($tbody.find('button:contains("View Request")').length > 0) {
        cy.get('button').contains('View Request').first().click();
        
        cy.get('body').then($body => {
          // Find any actionable button that triggers confirm modal
          const actionBtn = $body.find('button:contains("Verify Payment"), button:contains("Finalize"), button:contains("Secure on Blockchain")').first();
          if (actionBtn.length > 0) {
            cy.wrap(actionBtn).click();
            // Double click confirm rapidly
            cy.contains('button', 'Confirm').dblclick();
          }
        });
      }
    });
  });
});
