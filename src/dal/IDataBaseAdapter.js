/**
 * Data Access Layer (DAL) Interface
 * All database drivers (ExcelDriver, MysqlDriver, PostgresDriver) must implement this contract.
 */
export class IDataBaseAdapter {
  constructor(driverName) {
    this.driverName = driverName;
  }

  // Connect to database
  connect() {
    throw new Error("connect() method must be implemented");
  }

  // Disconnect from database
  disconnect() {
    throw new Error("disconnect() method must be implemented");
  }

  // Get driver details and connection status
  getStatus() {
    throw new Error("getStatus() method must be implemented");
  }

  // Fetch all items from table/sheet
  findAll(tableName) {
    throw new Error("findAll() method must be implemented");
  }

  // Find single item by primary ID
  findById(tableName, id) {
    throw new Error("findById() method must be implemented");
  }

  // Insert record into table/sheet
  insert(tableName, record) {
    throw new Error("insert() method must be implemented");
  }

  // Update record in table/sheet
  update(tableName, id, updatedRecord) {
    throw new Error("update() method must be implemented");
  }

  // Delete record from table/sheet
  delete(tableName, id) {
    throw new Error("delete() method must be implemented");
  }

  // Export full database (Excel file download or SQL script dump)
  exportData() {
    throw new Error("exportData() method must be implemented");
  }

  // Import raw data into database
  importData(data) {
    throw new Error("importData() method must be implemented");
  }
}
