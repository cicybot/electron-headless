/**
 * Account Manager
 * Handles account isolation, context switching, and resource sharing
 */

class AccountManager {
  constructor() {
    this.activeAccount = 0; // Default account
  }

  /**
   * Switch active account context
   */
  switchAccount(accountIndex) {
    if (typeof accountIndex !== 'number' || accountIndex < 0) {
      throw new Error('Account index must be a non-negative number');
    }
    this.activeAccount = accountIndex;
    return accountIndex;
  }

  /**
   * Get current active account
   */
  getActiveAccount() {
    return this.activeAccount;
  }

  /**
   * Validate account access for a window
   */
  validateWindowAccount(winId, requestedAccount) {
    const windowManager = require('./window-manager');
    // In a real implementation, we'd need to track which account owns which window
    // For now, return true if no specific account validation is needed
    return true;
  }

  /**
   * Get account information for a window
   */
  getWindowAccount(winId) {
    // This would need to be implemented based on how windows are tracked per account
    // For now, return a placeholder
    return { accountIndex: this.activeAccount };
  }

  /**
   * Get windows for a specific account
   */
  getAccountWindows(accountIndex) {
    const windowManager = require('./window-manager');
    const allWindows = windowManager.getAllWindows();

    // Filter windows by account
    const accountWindows = {};
    if (allWindows[accountIndex]) {
      accountWindows[accountIndex] = allWindows[accountIndex];
    }

    return accountWindows;
  }

  /**
   * Create partition string for account isolation
   */
  createPartition(accountIndex) {
    return `persist:p_${accountIndex}`;
  }

  /**
   * Check if two accounts share resources for a domain
   */
  doAccountsShareResources(account1, account2, domain) {
    // In the current implementation, accounts don't share resources
    // unless they have the same partition
    return account1 === account2;
  }

  /**
   * Get resource sharing info for accounts
   */
  getResourceSharingInfo() {
    return {
      isolationLevel: 'full', // full | domain | none
      sharedCookies: false,
      sharedCache: false,
      description: 'Each account has completely isolated browser context'
    };
  }
}

module.exports = new AccountManager();