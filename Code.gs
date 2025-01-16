// Entry point for the web application
function doGet() {
  initializeDatabase();
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Sweet Shop Manager')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Required structure definition
const REQUIRED_SHEETS = {
  Products: {
    requiredHeaders: ['id', 'name', 'category', 'description', 'unit', 'min_stock', 'quantity', 'cost_per_unit', 'selling_price', 'created_at', 'updated_at']
  },
  Ingredients: {
    requiredHeaders: ['id', 'name', 'unit', 'quantity', 'min_stock', 'cost_per_unit', 'created_at', 'updated_at']
  },
  Recipes: {
    requiredHeaders: ['id', 'name', 'product_id', 'yield', 'labor_cost', 'created_at', 'updated_at']
  },
  RecipeIngredients: {
    requiredHeaders: ['id', 'recipe_id', 'ingredient_id', 'quantity', 'created_at', 'updated_at']
  },
  Orders: {
    requiredHeaders: ['id', 'order_date', 'status', 'total', 'created_at', 'updated_at']
  },
  OrderItems: {
    requiredHeaders: ['id', 'order_id', 'product_id', 'quantity', 'price', 'created_at', 'updated_at']
  },
   // New Financial Management sheets
  CostCategories: {
    requiredHeaders: [
      'id', 
      'name',
      'type', // Fixed, Variable, Overhead
      'description',
      'created_at',
      'updated_at'
    ]
  },
  Expenses: {
    requiredHeaders: [
      'id',
      'category_id',
      'amount',
      'date',
      'description',
      'payment_method',
      'reference_number',
      'status', // Paid, Pending, etc.
      'created_at',
      'updated_at'
    ]
  },
  PriceHistory: {
    requiredHeaders: [
      'id',
      'item_id', // Can be product_id or ingredient_id
      'item_type', // Product or Ingredient
      'old_price',
      'new_price',
      'change_date',
      'reason',
      'created_at',
      'updated_at'
    ]
  },

  // Enhanced Inventory Management
  InventoryTransactions: {
    requiredHeaders: [
      'id',
      'item_id', // Can be product_id or ingredient_id
      'item_type', // Product or Ingredient
      'transaction_type', // Purchase, Sale, Adjustment, Waste
      'quantity',
      'batch_number',
      'expiry_date',
      'unit_price',
      'total_price',
      'reference_id', // Order ID or Purchase ID
      'notes',
      'created_at',
      'updated_at'
    ]
  },
  Suppliers: {
    requiredHeaders: [
      'id',
      'name',
      'contact_person',
      'phone',
      'email',
      'address',
      'payment_terms',
      'lead_time_days',
      'status', // Active, Inactive
      'created_at',
      'updated_at'
    ]
  },
  Purchases: {
    requiredHeaders: [
      'id',
      'supplier_id',
      'order_date',
      'expected_delivery',
      'actual_delivery',
      'status', // Ordered, Received, Partially Received, Cancelled
      'total_amount',
      'payment_status',
      'notes',
      'created_at',
      'updated_at'
    ]
  },
  PurchaseItems: {
    requiredHeaders: [
      'id',
      'purchase_id',
      'item_id', // Ingredient ID usually
      'quantity_ordered',
      'quantity_received',
      'unit_price',
      'total_price',
      'created_at',
      'updated_at'
    ]
  },

  // Add these to the REQUIRED_SHEETS object in Code.gs
ProductionBatches: {
  requiredHeaders: [
    'id',
    'batch_number',
    'start_date',
    'end_date',
    'status',        // planned, in_progress, completed, cancelled
    'notes',
    'created_by',
    'created_at',
    'updated_at'
  ]
},
ProductionBatchItems: {
  requiredHeaders: [
    'id',
    'batch_id',
    'product_id',
    'quantity',
    'produced_quantity',  // Add this field
    'recipe_id',     
    'status',        
    'notes',
    'created_at',
    'updated_at'
  ]
},
QualityControl: {
  requiredHeaders: [
    'id',
    'batch_id',
    'batch_item_id',
    'checkpoint_name',
    'status',        // passed, failed, pending
    'checked_by',
    'check_date',
    'notes',
    'created_at',
    'updated_at'
  ]
},

// Add to REQUIRED_SHEETS in Code.gs:

'TransferRequests': {
  requiredHeaders: [
    'id',
    'request_type',      // ingredient_to_production, production_to_showroom
    'item_id',          // product_id or ingredient_id
    'item_type',        // product, ingredient
    'total_quantity',   // total amount needed
    'transferred_quantity', // amount already transferred
    'remaining_quantity',  // amount still needed
    'status',           // pending, partial, completed
    'reference_id',     // production_batch_id or order_id
    'batch_number',     // Add this line
    'notes',
    'created_at',
    'updated_at'
  ]
},

'TransferMovements': {
  requiredHeaders: [
    'id',
    'transfer_request_id',
    'quantity',
    'from_location',    // main_storage, production, showroom
    'to_location',      // main_storage, production, showroom
    'transfer_date',
    'transferred_by',
    'notes',
    'created_at',
    'updated_at'
  ]
},

'ProductionProgress': {
  requiredHeaders: [
    'id',
    'batch_id',
    'product_id',
    'planned_quantity',
    'completed_quantity',
    'remaining_quantity',
    'ingredient_usage',  // JSON string of ingredient quantities used
    'status',           // in_progress, completed
    'notes',
    'created_at',
    'updated_at'
  ]
},

'IngredientUsage': {
  requiredHeaders: [
    'id',
    'production_progress_id',
    'ingredient_id',
    'required_quantity',
    'used_quantity',
    'remaining_quantity',
    'status',           // pending, partial, completed
    'notes',
    'created_at',
    'updated_at'
  ]
},

// Add this to your REQUIRED_SHEETS object in initializeDatabase
'ProductionIngredients': {
  requiredHeaders: [
    'id',
    'name',
    'unit',
    'quantity',
    'min_stock',
    'cost_per_unit',
    'created_at',
    'updated_at'
  ]
},
'ShowroomInventory': {
  requiredHeaders: [
    'id',
    'name',
    'unit',
    'quantity',
    'min_stock',
    'created_at',
    'updated_at'
  ]
}

};

// Initialize database structure
function initializeDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let modified = false;

  // Process each required sheet
  Object.entries(REQUIRED_SHEETS).forEach(([sheetName, config]) => {
    let sheet = ss.getSheetByName(sheetName);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      modified = true;
    }

    // Get existing headers if any exist
    let existingHeaders = [];
    if (sheet.getLastColumn() > 0) {
      existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }
    
    // If sheet is empty or has no headers, initialize with required headers
    if (existingHeaders.length === 0) {
      sheet.getRange(1, 1, 1, config.requiredHeaders.length)
        .setValues([config.requiredHeaders])
        .setBackground('#E6E6E6')
        .setFontWeight('bold')
        .setWrap(true);
      sheet.setFrozenRows(1);
      modified = true;
    } else {
      // Find missing required headers
      const missingHeaders = config.requiredHeaders.filter(header => 
        !existingHeaders.includes(header)
      );

      // Add missing headers if any
      if (missingHeaders.length > 0) {
        const newHeaders = [...existingHeaders, ...missingHeaders];
        sheet.getRange(1, 1, 1, newHeaders.length)
          .setValues([newHeaders])
          .setBackground('#E6E6E6')
          .setFontWeight('bold')
          .setWrap(true);
        sheet.setFrozenRows(1);
        modified = true;
      }
    }
  });

  return modified;
}

// Get all data
function getData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = {};
    
    // Get data from each sheet
    Object.entries(REQUIRED_SHEETS).forEach(([sheetName, config]) => {
      const sheet = ss.getSheetByName(sheetName);
      const dataKey = sheetName.charAt(0).toLowerCase() + sheetName.slice(1);
      data[dataKey] = [];
      
      if (sheet && sheet.getLastColumn() > 0 && sheet.getLastRow() > 0) {
        const values = sheet.getDataRange().getValues();
        if (values.length > 1) {
          const headers = values[0];
          data[dataKey] = values.slice(1).map(row => {
            const item = {};
            headers.forEach((header, index) => {
              // Only include fields that are in the required headers
              if (config.requiredHeaders.includes(header)) {
                item[header] = row[index];
              }
            });
            return item;
          });
        }
      }
    });

    // Special handling for recipes - attach ingredients
    if (data.recipes && data.recipeIngredients) {
      data.recipes = data.recipes.map(recipe => {
        recipe.ingredients = data.recipeIngredients
          .filter(ri => ri.recipe_id === recipe.id)
          .map(ri => ({
            ingredient_id: ri.ingredient_id,
            quantity: ri.quantity
          }));
        return recipe;
      });
    }

    // Special handling for orders - attach items
    if (data.orders && data.orderItems) {
      data.orders = data.orders.map(order => {
        order.items = data.orderItems
          .filter(oi => oi.order_id === order.id)
          .map(oi => ({
            product_id: oi.product_id,
            quantity: oi.quantity,
            price: oi.price
          }));
        return order;
      });
    }

    return JSON.stringify(data);
  } catch (error) {
    throw new Error('Failed to get data: ' + error.message);
  }
}

// Helper function to get column indices
function getColumnIndices(sheet, requiredHeaders) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const indices = {};
  
  requiredHeaders.forEach(header => {
    const index = headers.indexOf(header);
    if (index !== -1) {
      indices[header] = index;
    }
  });
  
  return indices;
}

// Helper function to save a single record
function saveRecordToSheet(sheet, data) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Generate ID if needed
  if (!data.id) {
    data.id = Utilities.getUuid();
  }
  
  // Add timestamps
  if (!data.created_at) {
    data.created_at = new Date();
  }
  data.updated_at = new Date();

  // Prepare row data array matching the sheet's column structure
  const rowData = new Array(headers.length).fill('');
  
  // Fill in the data using column indices
  Object.entries(data).forEach(([key, value]) => {
    const colIndex = headers.indexOf(key);
    if (colIndex !== -1) {
      rowData[colIndex] = value;
    }
  });

  // Find existing row if updating
  let existingRowIndex = -1;
  if (sheet.getLastRow() > 1) {
    const records = sheet.getDataRange().getValues();
    existingRowIndex = records.findIndex(row => row[headers.indexOf('id')] === data.id);
  }
  
  if (existingRowIndex > 0) {
    // Update existing row
    sheet.getRange(existingRowIndex + 1, 1, 1, headers.length).setValues([rowData]);
  } else {
    // Append new row
    sheet.appendRow(rowData);
  }

  return data;
}

// Save data to sheet
function saveToSheet(sheetName, data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet ${sheetName} not found`);

    // Handle special cases for Recipes and Orders
    if (sheetName === 'Recipes') {
      const ingredients = data.ingredients || [];
      delete data.ingredients; // Remove ingredients from recipe data
      
      // Save the recipe first
      const recipeResponse = saveRecordToSheet(sheet, data);
      
      // Then handle recipe ingredients
      const recipeIngredientsSheet = ss.getSheetByName('RecipeIngredients');
      if (!recipeIngredientsSheet) throw new Error('RecipeIngredients sheet not found');
      
      // Delete existing recipe ingredients
      if (data.id) {
        deleteRelatedRecords('RecipeIngredients', 'recipe_id', data.id);
      }
      
      // Save new recipe ingredients
      ingredients.forEach(ingredient => {
        saveRecordToSheet(recipeIngredientsSheet, {
          id: Utilities.getUuid(),
          recipe_id: recipeResponse.id,
          ingredient_id: ingredient.ingredient_id,
          quantity: ingredient.quantity,
          created_at: new Date(),
          updated_at: new Date()
        });
      });
    } 
    else if (sheetName === 'Orders') {
      const items = data.items || [];
      delete data.items; // Remove items from order data
      
      // Save the order first
      const orderResponse = saveRecordToSheet(sheet, data);
      
      // Then handle order items
      const orderItemsSheet = ss.getSheetByName('OrderItems');
      if (!orderItemsSheet) throw new Error('OrderItems sheet not found');
      
      // Delete existing order items
      if (data.id) {
        deleteRelatedRecords('OrderItems', 'order_id', data.id);
      }
      
      // Save new order items
      items.forEach(item => {
        saveRecordToSheet(orderItemsSheet, {
          id: Utilities.getUuid(),
          order_id: orderResponse.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          created_at: new Date(),
          updated_at: new Date()
        });
      });
    }
    else {
      // Normal save for other sheets
      saveRecordToSheet(sheet, data);
    }

    return getData();
  } catch (error) {
    throw new Error(`Failed to save ${sheetName}: ${error.message}`);
  }
}

// Helper function to delete related records
function deleteRelatedRecords(sheetName, foreignKeyField, foreignKeyValue) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const foreignKeyColIndex = headers.indexOf(foreignKeyField);
  if (foreignKeyColIndex === -1) return;

  const data = sheet.getDataRange().getValues();
  // Find all related rows (in reverse order to not mess up indices when deleting)
  for (let i = data.length - 1; i > 0; i--) {
    if (data[i][foreignKeyColIndex] === foreignKeyValue) {
      sheet.deleteRow(i + 1);
    }
  }
}

// Delete from sheet
function deleteFromSheet(sheetName, id) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet ${sheetName} not found`);

    // Handle special cases for Recipes and Orders
    if (sheetName === 'Recipes') {
      // Delete related recipe ingredients first
      deleteRelatedRecords('RecipeIngredients', 'recipe_id', id);
    } 
    else if (sheetName === 'Orders') {
      // Delete related order items first
      deleteRelatedRecords('OrderItems', 'order_id', id);
    }

    // Check if sheet has any data
    if (sheet.getLastRow() <= 1) {
      return getData(); // Nothing to delete in main sheet
    }

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const idColIndex = headers.indexOf('id');
    
    if (idColIndex === -1) {
      throw new Error('ID column not found');
    }

    // Find and delete the main record
    const data = sheet.getDataRange().getValues();
    const rowIndex = data.findIndex(row => row[idColIndex] === id);
    
    if (rowIndex > 0) {
      sheet.deleteRow(rowIndex + 1);
    }

    return getData();
  } catch (error) {
    throw new Error(`Failed to delete from ${sheetName}: ${error.message}`);
  }
}



// Track price changes and maintain history
function updateItemPrice(itemType, itemId, newPrice, reason) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(itemType === 'Product' ? 'Products' : 'Ingredients');
  
  // Get current price
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const priceColumn = headers.indexOf(itemType === 'Product' ? 'selling_price' : 'cost_per_unit');
  const idColumn = headers.indexOf('id');
  
  const row = data.find(row => row[idColumn] === itemId);
  if (!row) throw new Error('Item not found');
  
  const oldPrice = row[priceColumn];
  
  // Save price history
  saveToSheet('PriceHistory', {
    item_id: itemId,
    item_type: itemType,
    old_price: oldPrice,
    new_price: newPrice,
    change_date: new Date(),
    reason: reason
  });
  
  // Update item price
  return saveToSheet(itemType === 'Product' ? 'Products' : 'Ingredients', {
    id: itemId,
    [itemType === 'Product' ? 'selling_price' : 'cost_per_unit']: newPrice
  });
}

function recordInventoryTransaction(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('Recording inventory transaction with data:', data);

    // Validate transaction data
    const requiredFields = ['item_id', 'item_type', 'transaction_type', 'quantity'];
    requiredFields.forEach(field => {
      if (!data[field]) throw new Error(`Missing required field: ${field}`);
    });

    return saveToSheet('InventoryTransactions', {
      ...data,
      id: Utilities.getUuid(),
      created_at: new Date(),
      updated_at: new Date()
    });
  } catch (error) {
    Logger.log('Error in recordInventoryTransaction:', error);
    throw error;
  }
}

// Calculate current inventory value
function calculateInventoryValue() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let totalValue = 0;
  
  // Calculate products value
  const products = getSheetData('Products');
  totalValue += products.reduce((sum, product) => 
    sum + (product.quantity * product.cost_per_unit), 0);
  
  // Calculate ingredients value
  const ingredients = getSheetData('Ingredients');
  totalValue += ingredients.reduce((sum, ingredient) => 
    sum + (ingredient.quantity * ingredient.cost_per_unit), 0);
    
  return totalValue;
}

// Track expenses
function recordExpense(data) {
  // Validate expense data
  if (!data.category_id || !data.amount || !data.date) {
    throw new Error('Missing required expense fields');
  }
  
  return saveToSheet('Expenses', {
    ...data,
    status: data.status || 'Paid'
  });
}

// Calculate profit margins
function calculateProductMargins(startDate, endDate) {
  const orders = getSheetData('Orders')
    .filter(order => {
      const orderDate = new Date(order.order_date);
      return orderDate >= startDate && orderDate <= endDate;
    });
    
  const margins = {};
  const orderItems = getSheetData('OrderItems');
  const products = getSheetData('Products');
  
  orderItems.forEach(item => {
    const order = orders.find(o => o.id === item.order_id);
    if (!order) return;
    
    const product = products.find(p => p.id === item.product_id);
    if (!product) return;
    
    if (!margins[product.id]) {
      margins[product.id] = {
        name: product.name,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
        units_sold: 0
      };
    }
    
    margins[product.id].revenue += item.price * item.quantity;
    margins[product.id].cost += product.cost_per_unit * item.quantity;
    margins[product.id].units_sold += item.quantity;
  });
  
  // Calculate final margins
  Object.values(margins).forEach(product => {
    product.profit = product.revenue - product.cost;
    product.margin = product.revenue ? ((product.profit / product.revenue) * 100).toFixed(2) : 0;
    product.average_profit = product.units_sold ? (product.profit / product.units_sold).toFixed(2) : 0;
  });
  
  return margins;
}

// Generate financial summary for period
function generateFinancialSummary(startDate, endDate) {
  const orders = getSheetData('Orders')
    .filter(order => {
      const orderDate = new Date(order.order_date);
      return orderDate >= startDate && orderDate <= endDate;
    });
    
  const expenses = getSheetData('Expenses')
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const inventoryValue = calculateInventoryValue();
  
  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    if (!acc[expense.category_id]) {
      acc[expense.category_id] = 0;
    }
    acc[expense.category_id] += expense.amount;
    return acc;
  }, {});

  return {
    period: {
      start: startDate,
      end: endDate
    },
    revenue: revenue,
    expenses: totalExpenses,
    gross_profit: revenue - totalExpenses,
    profit_margin: revenue ? ((revenue - totalExpenses) / revenue * 100).toFixed(2) : 0,
    order_count: orders.length,
    average_order_value: orders.length ? (revenue / orders.length).toFixed(2) : 0,
    inventory_value: inventoryValue,
    expenses_by_category: expensesByCategory,
    date_generated: new Date()
  };
}

function createProductionBatch(batchData) {
  validateBatchData(batchData);
  
  const batchNumber = generateBatchNumber();
  const batch = {
    ...batchData,
    id: Utilities.getUuid(),
    batch_number: batchNumber,
    status: batchData.status || 'planned',
    created_at: new Date(),
    updated_at: new Date()
  };

  // Save batch to sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const batchSheet = ss.getSheetByName('ProductionBatches');
  const batchHeaders = batchSheet.getRange(1, 1, 1, batchSheet.getLastColumn()).getValues()[0];
  const batchRowData = batchHeaders.map(header => batch[header] || '');
  batchSheet.appendRow(batchRowData);

  // Save batch items if present
  if (batchData.items && batchData.items.length > 0) {
    const batchItemsSheet = ss.getSheetByName('ProductionBatchItems');
    const itemHeaders = batchItemsSheet.getRange(1, 1, 1, batchItemsSheet.getLastColumn()).getValues()[0];

    batchData.items.forEach(item => {
      const batchItem = {
        id: Utilities.getUuid(),
        batch_id: batch.id,
        product_id: item.product_id,
        quantity: item.quantity,
        produced_quantity: 0,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      };

      const itemRowData = itemHeaders.map(header => batchItem[header] || '');
      batchItemsSheet.appendRow(itemRowData);
    });
  }

  return batch;
}


function generateBatchNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Use existing sheet functions for batch count
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const batchesSheet = ss.getSheetByName('ProductionBatches');
  const batchesData = batchesSheet.getDataRange().getValues();
  const createdAtCol = batchesData[0].indexOf('created_at');
  
  const todayBatches = batchesData.filter((row, index) => {
    if (index === 0) return false; // Skip header
    const batchDate = new Date(row[createdAtCol]);
    return batchDate.toDateString() === date.toDateString();
  });
  
  const sequence = (todayBatches.length + 1).toString().padStart(3, '0');
  return `B${year}${month}${day}-${sequence}`;
}

// Create a transfer request
function createOrderTransferRequests(orderId) {
  const order = getOrderDetails(orderId);
  const transferRequests = [];

  order.items.forEach(item => {
    const recipe = getRecipeForProduct(item.product_id);
    if (!recipe) {
      throw new Error(`No recipe found for product: ${item.product_id}`);
    }

    recipe.ingredients.forEach(ing => {
      // Round to 3 decimal places
      const requiredQty = Number((ing.quantity * item.quantity / recipe.yield).toFixed(3));
      transferRequests.push({
        request_type: 'ingredient_to_production',
        item_id: ing.ingredient_id,
        item_type: 'ingredient',
        total_quantity: requiredQty,
        transferred_quantity: 0,
        remaining_quantity: requiredQty,
        reference_id: orderId
      });
    });
  });

  transferRequests.forEach(request => createTransferRequest(request));
  return getData();
}

// Record a partial transfer
// In Code.gs - we have the functions but they need some fixes
function recordPartialTransfer(data) {
  try {
    // Get current transfer request
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const requestSheet = ss.getSheetByName('TransferRequests');
    const requestData = requestSheet.getDataRange().getValues();
    const requestHeaders = requestData[0];
    
    const requestRow = requestData.find((row, index) => 
      index > 0 && row[requestHeaders.indexOf('id')] === data.transfer_request_id
    );

    if (!requestRow) {
      throw new Error('Transfer request not found');
    }

    // Get request details as object
    const requestObj = {};
    requestHeaders.forEach((header, index) => {
      requestObj[header] = requestRow[index];
    });

    // Create transfer movement record
    const movement = {
      id: Utilities.getUuid(),
      transfer_request_id: data.transfer_request_id,
      quantity: data.quantity,
      from_location: data.from_location,
      to_location: data.to_location,
      transfer_date: new Date(),
      transferred_by: Session.getActiveUser().getEmail(),
      notes: data.notes || '',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Save movement
    saveToSheet('TransferMovements', movement);

    // Update transfer request status
    const newTransferredQty = (requestObj.transferred_quantity || 0) + data.quantity;
    const newRemainingQty = requestObj.total_quantity - newTransferredQty;

    const updatedRequest = {
      ...requestObj,
      transferred_quantity: newTransferredQty,
      remaining_quantity: newRemainingQty,
      status: newRemainingQty <= 0 ? 'completed' : 'partial',
      updated_at: new Date()
    };

    saveToSheet('TransferRequests', updatedRequest);

    // Update inventory in both locations
    updateLocationInventory(
      data.from_location, 
      requestObj.item_type,
      requestObj.item_id, 
      -data.quantity
    );
    
    updateLocationInventory(
      data.to_location,
      requestObj.item_type,
      requestObj.item_id, 
      data.quantity
    );

    return getData();
  } catch (error) {
    throw new Error(`Failed to record transfer: ${error.message}`);
  }
}


// Add function to check if batch can start production
function checkBatchReadyForProduction(batchId) {
  const transfers = getTransferRequestsForBatch(batchId);
  const hasIngredients = transfers.some(t => t.transferred_quantity > 0);
  
  if (hasIngredients) {
    const batchSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ProductionBatches');
    const data = batchSheet.getDataRange().getValues();
    const headers = data[0];
    const rowIndex = data.findIndex(row => row[headers.indexOf('id')] === batchId);
    
    if (rowIndex > 0) {
      const currentStatus = data[rowIndex][headers.indexOf('status')];
      if (currentStatus === 'ordered') {
        // Update status to indicate ingredients are available
        batchSheet.getRange(rowIndex + 1, headers.indexOf('status') + 1)
          .setValue('ready_for_production');
      }
    }
  }
}

// Update inventory at a specific location
function updateLocationInventory(location, itemType, itemId, quantity) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let locationSheet;
    const sheetName = location === 'production' ? 'ProductionIngredients' : 'Ingredients';
    
    locationSheet = ss.getSheetByName(sheetName);
    if (!locationSheet) {
      // Create sheet if it doesn't exist
      locationSheet = ss.insertSheet(sheetName);
      // Initialize headers
      const headers = ['id', 'name', 'unit', 'quantity', 'min_stock', 'cost_per_unit', 'created_at', 'updated_at'];
      locationSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // Get item details from main ingredients sheet
    const ingredientsSheet = ss.getSheetByName('Ingredients');
    const ingredientsData = ingredientsSheet.getDataRange().getValues();
    const ingredientsHeaders = ingredientsData[0];
    const ingredient = ingredientsData.find((row, index) => 
      index > 0 && row[ingredientsHeaders.indexOf('id')] === itemId
    );

    if (!ingredient) {
      throw new Error(`Ingredient with ID ${itemId} not found`);
    }

    // Update or create item in location sheet
    const locationData = locationSheet.getDataRange().getValues();
    const locationHeaders = locationData[0];
    const locationRow = locationData.findIndex((row, index) => 
      index > 0 && row[locationHeaders.indexOf('id')] === itemId
    );

    if (locationRow === -1) {
      // Create new row
      const newRow = locationHeaders.map(header => {
        if (header === 'quantity') return quantity;
        if (header === 'created_at' || header === 'updated_at') return new Date();
        return ingredient[ingredientsHeaders.indexOf(header)];
      });
      locationSheet.appendRow(newRow);
    } else {
      // Update existing row
      const currentQty = locationData[locationRow][locationHeaders.indexOf('quantity')] || 0;
      locationSheet.getRange(locationRow + 1, locationHeaders.indexOf('quantity') + 1)
        .setValue(currentQty + quantity);
      locationSheet.getRange(locationRow + 1, locationHeaders.indexOf('updated_at') + 1)
        .setValue(new Date());
    }

    return true;
  } catch (error) {
    Logger.log('Error in updateLocationInventory: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    throw error;
  }
}

// Transfer Functions for Code.gs


// In Code.gs

function confirmIngredientReceipt(transferId, quantity) {
  try {
    const transfer = getTransferRequestDetails(transferId);
    if (!transfer) throw new Error('Transfer request not found');

    // Get current inventory
    const currentStock = getIngredientInventory(transfer.item_id);

    if (currentStock < quantity) {
      throw new Error(`Insufficient stock. Only ${currentStock.toFixed(3)} ${transfer.unit} available`);
    }

    // Record the transfer with rounded quantity
    const result = recordPartialTransfer({
      transfer_request_id: transferId,
      quantity: Math.round(quantity * 1000) / 1000,
      from_location: 'main_storage',
      to_location: 'production',
      notes: 'Production receipt confirmation'
    });

    // If all ingredients for a batch are received, update batch status
    checkBatchIngredients(transfer.reference_id);

    return result;
  } catch (error) {
    Logger.log('Error in confirmIngredientReceipt: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    throw error;
  }
}


function checkBatchIngredients(batchId) {
  // Check if all ingredients are received for this batch
  const transfers = getTransferRequestsForBatch(batchId);
  const allReceived = transfers.every(t => 
    t.transferred_quantity >= t.total_quantity
  );

  if (allReceived) {
    // Update batch status to ready for production
    updateBatchStatus(batchId, 'ready_for_production');
  }
}
function getTransferRequest(itemId, referenceId, requestType) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TransferRequests');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const request = data.find((row, index) => 
    index > 0 && 
    row[headers.indexOf('item_id')] === itemId &&
    row[headers.indexOf('reference_id')] === referenceId &&
    row[headers.indexOf('request_type')] === requestType &&
    row[headers.indexOf('status')] !== 'completed'
  );

  if (!request) return null;

  const requestObj = {};
  headers.forEach((header, index) => {
    requestObj[header] = request[index];
  });
  
  return requestObj;
}
// Add to Code.gs
function createOrderTransferRequests(orderId) {
  const order = getOrderDetails(orderId);
  const transferRequests = [];

  order.items.forEach(item => {
    const recipe = getRecipeForProduct(item.product_id);
    if (!recipe) {
      throw new Error(`No recipe found for product: ${item.product_id}`);
    }

    recipe.ingredients.forEach(ing => {
      const requiredQty = (ing.quantity * item.quantity) / recipe.yield;
      transferRequests.push({
        request_type: 'ingredient_to_production',
        item_id: ing.ingredient_id,
        item_type: 'ingredient',
        total_quantity: requiredQty,
        reference_id: orderId
      });
    });
  });

  transferRequests.forEach(request => createTransferRequest(request));
  return getData();
}

function getRecipeForProduct(productId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Recipes');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const recipe = data.find((row, index) => 
    index > 0 && row[headers.indexOf('product_id')] === productId
  );

  if (!recipe) return null;

  const recipeObj = {};
  headers.forEach((header, index) => {
    recipeObj[header] = recipe[index];
  });

  // Get recipe ingredients
  const riSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('RecipeIngredients');
  const riData = riSheet.getDataRange().getValues();
  const riHeaders = riData[0];
  
  recipeObj.ingredients = riData
    .filter((row, index) => index > 0 && row[riHeaders.indexOf('recipe_id')] === recipeObj.id)
    .map(row => {
      const ing = {};
      riHeaders.forEach((header, index) => {
        ing[header] = row[index];
      });
      return ing;
    });

  return recipeObj;
}

function getOrderDetails(orderId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const order = data.find((row, index) => 
    index > 0 && row[headers.indexOf('id')] === orderId
  );

  if (!order) throw new Error('Order not found');

  const orderObj = {};
  headers.forEach((header, index) => {
    orderObj[header] = order[index];
  });

  // Get order items
  const itemsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('OrderItems');
  const itemsData = itemsSheet.getDataRange().getValues();
  const itemsHeaders = itemsData[0];
  
  orderObj.items = itemsData
    .filter((row, index) => index > 0 && row[itemsHeaders.indexOf('order_id')] === orderId)
    .map(row => {
      const item = {};
      itemsHeaders.forEach((header, index) => {
        item[header] = row[index];
      });
      return item;
    });

  return orderObj;
}

function updateOrderStatus(orderId, status) {
  const order = getOrderDetails(orderId);
  if (!order) throw new Error('Order not found');

  if (status === 'approved') {
    // First create the batch, which will return the batch with batch_number
    createBatchFromOrder(orderId);
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[headers.indexOf('id')] === orderId);

  if (rowIndex > 0) {
    sheet.getRange(rowIndex + 1, headers.indexOf('status') + 1).setValue(status);
    sheet.getRange(rowIndex + 1, headers.indexOf('updated_at') + 1).setValue(new Date());
  }

  return getData();
}

function validateBatchData(data) {
  const required = ['start_date', 'planned_quantity'];
  const errors = [];
  
  required.forEach(field => {
    if (!data[field]) {
      errors.push(`${field} is required`);
    }
  });

  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }

  // Additional validation if needed
  if (data.planned_quantity && data.planned_quantity <= 0) {
    throw new Error('Planned quantity must be greater than 0');
  }
}

function startProduction(orderId) {
  const order = getOrderDetails(orderId);
  if (!order) throw new Error('Order not found');

  // Check if all ingredients are available in production
  const transferRequests = getTransferRequestsForOrder(orderId);
  const pendingTransfers = transferRequests.filter(tr => tr.status !== 'completed');
  
  if (pendingTransfers.length > 0) {
    throw new Error('Cannot start production: pending ingredient transfers');
  }

  createProductionBatch({
    order_id: orderId,
    items: order.items,
    start_date: new Date(),
    notes: `Auto-created from Order #${orderId}`
  });

  updateOrderStatus(orderId, 'in_production');
  return getData();
}

function getTransferRequestsForOrder(orderId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TransferRequests');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  return data
    .filter((row, index) => 
      index > 0 && row[headers.indexOf('reference_id')] === orderId
    )
    .map(row => {
      const request = {};
      headers.forEach((header, index) => {
        request[header] = row[index];
      });
      return request;
    });
}

function createOrderTransferRequests(orderId) {
  const order = getOrderDetails(orderId);
  const transferRequests = [];

  // Calculate total ingredients needed
  order.items.forEach(item => {
    const recipe = getRecipeForProduct(item.product_id);
    recipe.ingredients.forEach(ing => {
      const requiredQty = (ing.quantity * item.quantity) / recipe.yield;
      transferRequests.push({
        request_type: 'ingredient_to_production',
        item_id: ing.ingredient_id,
        item_type: 'ingredient',
        total_quantity: requiredQty,
        reference_id: orderId
      });
    });
  });

  // Create transfer requests
  transferRequests.forEach(request => createTransferRequest(request));
}

function createTransferRequest(data) {
  // Validate required fields
  const requiredFields = [
    'request_type',
    'item_id',
    'item_type',
    'total_quantity',
    'batch_number',
    'reference_id'
  ];
  
  requiredFields.forEach(field => {
    if (!data[field]) throw new Error(`Missing required field: ${field}`);
  });

  const transferRequest = {
    id: Utilities.getUuid(),
    request_type: data.request_type,
    item_id: data.item_id,
    item_type: data.item_type,
    batch_number: data.batch_number,
    reference_id: data.reference_id,
    total_quantity: data.total_quantity,
    transferred_quantity: data.transferred_quantity || 0,
    remaining_quantity: data.remaining_quantity || data.total_quantity,
    status: 'pending',
    notes: data.notes || '',
    created_at: new Date(),
    updated_at: new Date()
  };

  // Save transfer request to sheet
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TransferRequests');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowData = headers.map(header => transferRequest[header] || '');
  sheet.appendRow(rowData);

  return transferRequest;
}



function updateBatchStatus(batchId, newStatus) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('ProductionBatches');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rowIndex = data.findIndex(row => row[headers.indexOf('id')] === batchId);

    if (rowIndex === -1) throw new Error('Batch not found');

    // When starting production
    if (newStatus === 'in_progress') {
      // Get transfer requests from TransferRequests sheet directly
      const transferSheet = ss.getSheetByName('TransferRequests');
      const transferData = transferSheet.getDataRange().getValues();
      const transferHeaders = transferData[0];
      
      const transferRequests = transferData.slice(1)
        .filter(row => row[transferHeaders.indexOf('reference_id')] === batchId)
        .map(row => {
          const transfer = {};
          transferHeaders.forEach((header, index) => {
            transfer[header] = row[index];
          });
          return transfer;
        });

      const hasReceivedIngredients = transferRequests.some(tr => 
        tr.transferred_quantity > 0
      );

      if (!hasReceivedIngredients) {
        throw new Error('Cannot start production: no ingredients received');
      }
    }

    // Update batch status
    sheet.getRange(rowIndex + 1, headers.indexOf('status') + 1).setValue(newStatus);
    sheet.getRange(rowIndex + 1, headers.indexOf('updated_at') + 1).setValue(new Date());

    // Update batch items status if needed
    if (newStatus === 'in_progress') {
      const batchItemsSheet = ss.getSheetByName('ProductionBatchItems');
      const batchItemsData = batchItemsSheet.getDataRange().getValues();
      const batchItemsHeaders = batchItemsData[0];
      
      batchItemsData.forEach((row, index) => {
        if (index > 0 && row[batchItemsHeaders.indexOf('batch_id')] === batchId) {
          batchItemsSheet.getRange(index + 1, batchItemsHeaders.indexOf('status') + 1)
            .setValue('in_production');
        }
      });
    }

    return getData();
  } catch (error) {
    throw new Error(`Failed to update batch status: ${error.message}`);
  }
}




function getIngredientDetails(ingredientId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Ingredients');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const row = data.find((r, index) => index > 0 && r[headers.indexOf('id')] === ingredientId);
  if (!row) return null;

  const ingredient = {};
  headers.forEach((header, index) => {
    ingredient[header] = row[index];
  });
  return ingredient;
}

function getTransferRequestDetails(transferId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TransferRequests');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const row = data.find((r, index) => index > 0 && r[headers.indexOf('id')] === transferId);
  if (!row) return null;

  const transfer = {};
  headers.forEach((header, index) => {
    transfer[header] = row[index];
  });
  
  // Get additional details
  if (transfer.item_type === 'ingredient') {
    const ingredient = getIngredientDetails(transfer.item_id);
    if (ingredient) {
      transfer.ingredient_name = ingredient.name;
      transfer.unit = ingredient.unit;
      transfer.stock_quantity = ingredient.quantity;
    }
  }

  return transfer;
}

// Add to Code.gs
function getIngredientInventory(ingredientId) {
  try {
    // First check if ingredient exists
    const ingredientsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Ingredients');
    const ingredientsData = ingredientsSheet.getDataRange().getValues();
    const ingredientsHeaders = ingredientsData[0];
    const ingredient = ingredientsData.find((row, index) => 
      index > 0 && row[ingredientsHeaders.indexOf('id')] === ingredientId
    );

    if (!ingredient) throw new Error('Ingredient not found');

    // Get or create inventory sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let invSheet = ss.getSheetByName('IngredientInventory');
    if (!invSheet) {
      invSheet = ss.insertSheet('IngredientInventory');
      invSheet.getRange(1, 1, 1, 4).setValues([['id', 'quantity', 'location', 'last_updated']]);
    }

    // Get current inventory
    const invData = invSheet.getDataRange().getValues();
    const invHeaders = invData[0];
    const stockRow = invData.find((row, index) => 
      index > 0 && 
      row[invHeaders.indexOf('id')] === ingredientId &&
      row[invHeaders.indexOf('location')] === 'main_storage'
    );

    return stockRow ? stockRow[invHeaders.indexOf('quantity')] : 0;
  } catch (error) {
    Logger.log('Error in getIngredientInventory: ' + error.message);
    throw error;
  }
}

function createBatchFromOrder(orderId) {
  // Get order details
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const orderRow = data.find(row => row[headers.indexOf('id')] === orderId);
  if (!orderRow) throw new Error('Order not found');

  // Convert to order object
  const order = {};
  headers.forEach((header, index) => {
    order[header] = orderRow[index];
  });

  // Get order items
  const itemsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('OrderItems');
  const itemsData = itemsSheet.getDataRange().getValues();
  const itemsHeaders = itemsData[0];
  order.items = itemsData.slice(1)
    .filter(row => row[itemsHeaders.indexOf('order_id')] === orderId)
    .map(row => {
      const item = {};
      itemsHeaders.forEach((header, index) => {
        item[header] = row[index];
      });
      return item;
    });

  // Create production batch
  const newBatchData = {
    start_date: new Date(),
    planned_quantity: order.items.reduce((total, item) => total + Number(item.quantity), 0),
    actual_quantity: 0,
    status: 'ordered',
    order_id: orderId,
    notes: `Created from Order #${orderId}`,
    items: order.items.map(item => ({  // Add this to create batch items
      product_id: item.product_id,
      quantity: item.quantity,
      status: 'pending'
    }))
  };

  // Create batch
  const createdBatch = createProductionBatch(newBatchData);
  if (!createdBatch || !createdBatch.batch_number) {
    throw new Error('Failed to create production batch or missing batch number');
  }

  // Create ingredient transfer requests
  order.items.forEach(item => {
    const recipe = getRecipeForProduct(item.product_id);
    if (!recipe) throw new Error(`Recipe not found for product ${item.product_id}`);

    recipe.ingredients.forEach(ingredient => {
      const transferRequest = {
        request_type: 'ingredient_to_production',
        item_id: ingredient.ingredient_id,
        item_type: 'ingredient',
        batch_number: createdBatch.batch_number,
        reference_id: createdBatch.id,
        total_quantity: (ingredient.quantity * item.quantity) / recipe.yield,
        transferred_quantity: 0,
        remaining_quantity: (ingredient.quantity * item.quantity) / recipe.yield,
        status: 'pending'
      };

      createTransferRequest(transferRequest);
    });
  });

  // Update order status
  const orderRowIndex = data.findIndex(row => row[headers.indexOf('id')] === orderId);
  if (orderRowIndex > 0) {
    sheet.getRange(orderRowIndex + 1, headers.indexOf('status') + 1).setValue('approved');
  }

  return getData();
}


function getOrderById(orderId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find the row with matching ID
  const orderRow = data.find(row => row[headers.indexOf('id')] === orderId);
  if (!orderRow) return null;

  // Convert row to object using headers
  const order = {};
  headers.forEach((header, index) => {
    order[header] = orderRow[index];
  });

  // Get order items
  const orderItems = getOrderItems(orderId);
  order.items = orderItems;

  return order;
}

function getOrderItems(orderId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('OrderItems');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  return data.slice(1)  // Skip header row
    .filter(row => row[headers.indexOf('order_id')] === orderId)
    .map(row => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index];
      });
      return item;
    });
}

function recordProductionProgress(data) {
  try {
    if (!data.batch_id || !data.product_id || !data.quantity_produced) {
      throw new Error('Missing required fields');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get batch item details
    const batchItemsSheet = ss.getSheetByName('ProductionBatchItems');
    const batchItemsData = batchItemsSheet.getDataRange().getValues();
    const batchItemsHeaders = batchItemsData[0];
    const batchItemRow = batchItemsData.findIndex(row =>
      row[batchItemsHeaders.indexOf('batch_id')] === data.batch_id &&
      row[batchItemsHeaders.indexOf('product_id')] === data.product_id
    );

    if (batchItemRow === -1) throw new Error('Batch item not found');

    const currentItem = {};
    batchItemsHeaders.forEach((header, index) => {
      currentItem[header] = batchItemsData[batchItemRow][index];
    });

    // Calculate new produced quantity
    const newProducedQty = Math.round((currentItem.produced_quantity || 0) + data.quantity_produced * 1000) / 1000;

    // Get recipe and record ingredient consumption
    const recipe = getRecipeForProduct(data.product_id);
    if (!recipe) throw new Error('Recipe not found');

    recipe.ingredients.forEach(ing => {
      const usedQuantity = (ing.quantity * data.quantity_produced) / recipe.yield;
      
      recordInventoryTransaction({
        id: Utilities.getUuid(),
        item_type: 'ingredient',
        item_id: ing.ingredient_id,
        transaction_type: 'Consumption',
        quantity: usedQuantity,
        batch_number: currentItem.batch_number,
        from_location: 'production',
        to_location: 'consumed',
        unit_price: 0,
        total_price: 0,
        reference_id: data.batch_id,
        reference_type: 'production_consumed',
        notes: 'Ingredient consumption in production',
        created_at: new Date(),
        updated_at: new Date()
      });
    });

    // Record produced product
    recordInventoryTransaction({
      id: Utilities.getUuid(),
      item_type: 'Product',
      item_id: data.product_id,
      transaction_type: 'Production',
      quantity: data.quantity_produced,
      batch_number: currentItem.batch_number,
      from_location: 'production',
      to_location: 'production_storage',
      unit_price: 0,
      total_price: 0,
      reference_id: data.batch_id,
      reference_type: 'production',
      notes: 'Product production completed',
      created_at: new Date(),
      updated_at: new Date()
    });

    // Update batch item with produced quantity and status
    batchItemsSheet.getRange(batchItemRow + 1, batchItemsHeaders.indexOf('produced_quantity') + 1)
      .setValue(newProducedQty);

    if (newProducedQty >= currentItem.quantity) {
      batchItemsSheet.getRange(batchItemRow + 1, batchItemsHeaders.indexOf('status') + 1)
        .setValue('ready_for_transfer');

      // Check if all batch items are complete
      const allBatchItems = batchItemsData.filter(row =>
        row[batchItemsHeaders.indexOf('batch_id')] === data.batch_id
      );

      const allComplete = allBatchItems.every(row => {
        const status = row[batchItemsHeaders.indexOf('status')];
        const produced = row[batchItemsHeaders.indexOf('produced_quantity')] || 0;
        const required = row[batchItemsHeaders.indexOf('quantity')];
        return produced >= required && status === 'ready_for_transfer';
      });

      if (allComplete) {
        // Update batch status to complete
        const batchesSheet = ss.getSheetByName('ProductionBatches');
        const batchData = batchesSheet.getDataRange().getValues();
        const batchHeaders = batchData[0];
        const batchRow = batchData.findIndex(row =>
          row[batchHeaders.indexOf('id')] === data.batch_id
        );

        if (batchRow > -1) {
          batchesSheet.getRange(batchRow + 1, batchHeaders.indexOf('status') + 1)
            .setValue('completed');
        }
      }
    } else {
      batchItemsSheet.getRange(batchItemRow + 1, batchItemsHeaders.indexOf('status') + 1)
        .setValue('in_production');
    }

    return getData();
  } catch (error) {
    throw new Error(`Failed to record production progress: ${error.message}`);
  }
}

function consumeProductionIngredients(batchId, ingredients) {
  ingredients.forEach(ing => {
    // Reduce ingredient quantity in production area
    updateLocationInventory(
      'production',
      'ingredient',
      ing.ingredient_id,
      -ing.quantity_used
    );

   // In consumeProductionIngredients:
recordInventoryTransaction({
  id: Utilities.getUuid(),
  item_type: 'ingredient',
  item_id: ing.ingredient_id,
  transaction_type: 'Consumption',
  quantity: ing.quantity_used,
  batch_number: batch_number,
  from_location: 'production',
  to_location: 'consumed',
  unit_price: 0,
  total_price: 0,
  reference_id: batchId,
  reference_type: 'production_consumed',
  notes: 'Ingredient consumption in production',
  created_at: new Date(),
  updated_at: new Date()
});
  });
}

function calculateIngredientUsage(recipe, quantityProduced) {
  return recipe.ingredients.map(ing => ({
    ingredient_id: ing.ingredient_id,
    quantity_used: (ing.quantity * quantityProduced) / recipe.yield
  }));
}

function checkIngredientAvailability(batchId, productId, quantityToMake) {
  try {
    const recipe = getRecipeForProduct(productId);
    if (!recipe) throw new Error('Recipe not found');

    // Calculate required ingredients
    const requiredIngredients = recipe.ingredients.map(ing => ({
      ingredient_id: ing.ingredient_id,
      required_quantity: (ing.quantity * quantityToMake) / recipe.yield
    }));

    // Check available quantities in production area
    const availabilityCheck = requiredIngredients.map(ing => {
      const available = getLocationInventory('production', 'ingredient', ing.ingredient_id);
    
      
      Logger.log('Available quantity:', available);

      if (available < transfer.quantity) {
        throw new Error(`Insufficient quantity. Available: ${available}, Requested: ${transfer.quantity}`);
      
      }


      return {
        ingredient_id: ing.ingredient_id,
        required: ing.required_quantity,
        available: available,
        sufficient: available >= ing.required_quantity
      };
    });

    return {
      canProduce: availabilityCheck.every(check => check.sufficient),
      ingredients: availabilityCheck
    };
  } catch (error) {
    throw new Error(`Failed to check ingredient availability: ${error.message}`);
  }
}






function getLocationInventory(location, itemType, itemId) {
  console.log('Checking inventory for:', { location, itemType, itemId });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const transactions = ss.getSheetByName('InventoryTransactions');
  if (!transactions) {
    throw new Error('InventoryTransactions sheet not found');
  }

  const data = transactions.getDataRange().getValues();
  const headers = data[0];
  
  // Get all transactions for this item and location
  const relevantTransactions = data.slice(1).filter(row => {
    const rowItemId = row[headers.indexOf('item_id')];
    const rowItemType = row[headers.indexOf('item_type')];
    const rowToLocation = row[headers.indexOf('to_location')];
    const rowFromLocation = row[headers.indexOf('from_location')];

    return rowItemId === itemId && 
           rowItemType === itemType && 
           (rowToLocation === location || rowFromLocation === location);
  });

  // Calculate net quantity
  let quantity = 0;
  relevantTransactions.forEach(row => {
    const toLocation = row[headers.indexOf('to_location')];
    const fromLocation = row[headers.indexOf('from_location')];
    const transactionQuantity = row[headers.indexOf('quantity')] || 0;

    if (toLocation === location) {
      quantity += transactionQuantity;
    }
    if (fromLocation === location) {
      quantity -= transactionQuantity;
    }
  });

  return quantity;
}










// In Code.gs - this function exists but needs fixes
function transferFinishedProducts(data) {
  try {
    if (!data.batch_id || !data.transfers || !data.transfers.length) {
      throw new Error('Invalid transfer data');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('Data received:', data);

    // Process each product transfer
    data.transfers.forEach(transfer => {
      // Log the transfer attempt
      Logger.log('Attempting transfer:', transfer);

      // Check available quantity
      const available = getLocationInventory('production_storage', 'Product', transfer.product_id);
      Logger.log('Available quantity:', available);

      if (available < transfer.quantity) {
        throw new Error(`Insufficient quantity. Available: ${available}, Requested: ${transfer.quantity}`);
      }

      // Record inventory movement
      recordInventoryTransaction({
        item_type: 'Product',
        item_id: transfer.product_id,
        transaction_type: 'Transfer',
        from_location: 'production_storage',
        to_location: 'showroom',
        quantity: transfer.quantity,
        batch_id: data.batch_id,
        reference_type: 'finished_product_transfer',
        notes: 'Transfer to showroom'
      });

      // Update batch item status
      const batchItemsSheet = ss.getSheetByName('ProductionBatchItems');
      const batchItemsData = batchItemsSheet.getDataRange().getValues();
      const batchItemsHeaders = batchItemsData[0];
      const batchItemRow = batchItemsData.findIndex(row => 
        row[batchItemsHeaders.indexOf('batch_id')] === data.batch_id &&
        row[batchItemsHeaders.indexOf('product_id')] === transfer.product_id
      );

      if (batchItemRow !== -1) {
        const currentItem = {};
        batchItemsHeaders.forEach((header, index) => {
          currentItem[header] = batchItemsData[batchItemRow][index];
        });

        const remainingToTransfer = currentItem.produced_quantity - transfer.quantity;
        if (remainingToTransfer <= 0) {
          batchItemsSheet.getRange(batchItemRow + 1, batchItemsHeaders.indexOf('status') + 1)
            .setValue('transferred');
        }
      }
    });

    return getData();
  } catch (error) {
    Logger.log('Error in transferFinishedProducts:', error);
    throw new Error(`Failed to transfer finished products: ${error.message}`);
  }
}





function updateFinishedProductStatus(batchId, productId, status) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ProductionBatchItems');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const rowIndex = data.findIndex(row => 
      row[headers.indexOf('batch_id')] === batchId && 
      row[headers.indexOf('product_id')] === productId
    );

    if (rowIndex === -1) throw new Error('Batch item not found');

    sheet.getRange(rowIndex + 1, headers.indexOf('status') + 1).setValue(status);
    sheet.getRange(rowIndex + 1, headers.indexOf('updated_at') + 1).setValue(new Date());

    // If all products in batch are finished, update batch status
    checkBatchCompletion(batchId);

    return getData();
  } catch (error) {
    throw new Error(`Failed to update product status: ${error.message}`);
  }
}

function checkBatchCompletion(batchId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ProductionBatchItems');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const batchItems = data.slice(1).filter(row => row[headers.indexOf('batch_id')] === batchId);
  const allCompleted = batchItems.every(item => 
    item[headers.indexOf('status')] === 'completed' || 
    item[headers.indexOf('status')] === 'ready_for_transfer'
  );

  if (allCompleted) {
    updateBatchStatus(batchId, 'completed');
  }
}

// Add this missing function that's causing the error
function getTransferRequestsForBatch(batchId) {
  const transferSheet = getTransferRequestsSheet();
  const data = transferSheet.getDataRange().getValues();
  const headers = data[0];
  
  const batchIdCol = headers.indexOf('BatchId');
  const ingredientIdCol = headers.indexOf('IngredientId');
  const quantityCol = headers.indexOf('Quantity');
  const statusCol = headers.indexOf('Status');
  
  return data.slice(1)
    .filter(row => row[batchIdCol] === batchId)
    .map(row => ({
      batchId: row[batchIdCol],
      ingredientId: row[ingredientIdCol],
      quantity: row[quantityCol],
      status: row[statusCol]
    }));
}

// Enhance the existing confirmBatchReceipt function
function confirmBatchReceipt(batchId, ingredients) {
  const batch = getBatch(batchId);
  if (!batch) throw new Error('Batch not found');

  const transfers = ingredients.map(ingredient => ({
    batchId: batchId,
    ingredientId: ingredient.id,
    quantity: ingredient.quantity,
    status: ingredient.quantity >= ingredient.required ? 'Completed' : 'Partial'
  }));

  // Record transfers and update status
  transfers.forEach(transfer => recordTransfer(transfer));
  
  // Update batch status if all ingredients are received
  updateBatchStatus(batchId);
  
  return {
    success: true,
    message: 'Transfers recorded successfully',
    completedIngredients: transfers
      .filter(t => t.status === 'Completed')
      .map(t => t.ingredientId)
  };
}
