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
  InventoryMovements: {
    requiredHeaders: [
      'id',
      'item_id', // Can be product_id or ingredient_id
      'item_type', // Product or Ingredient
      'transaction_type', // Purchase, Sale, Adjustment, Waste, Transfer
      'quantity',
      'batch_number',
      'expiry_date',
      'unit_price',
      'total_price',
      'reference_id', // Order ID or Purchase ID
      'notes',
      'created_at',
      'updated_at',
      'from_location',
      'to_location',
      'transfer_request_id'
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
      'status', // Add: pending_approval, approved, partially_received, received, rejected
      'approval_date',
      'approved_by',
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
    'produced_quantity',
    'recipe_id',
    'status',
    'notes',
    'progress_notes',  // Added new field
    'created_at',
    'updated_at'
  ]
},

  IngredientDetails: {
    requiredHeaders: [
      'id',
      'ingredient_id',
      'quantity',
      'used_quantity',
      'batch_number',
      'created_at',
      'updated_at',
      'notes'
    ]
  },

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

'DailyStockCounts': {
    requiredHeaders: [
      'id',
      'date',
      'location',
      'item_id',
      'item_type', // 'product' or 'ingredient'
      'counted_quantity',
      'system_quantity',
      'variance',
      'variance_percentage',
      'notes',
      'counted_by',
      'verified_by',
      'status', // 'pending', 'verified', 'investigated'
      'created_at',
      'updated_at'
    ]
  },

  'StockAlerts': {
  requiredHeaders: [
    'id',
    'date',
    'item_id',
    'item_type',
    'location',
    'variance',
    'variance_percentage',
    'status', // 'pending', 'investigated', 'resolved'
    'notes',
    'investigated_by',
    'investigation_date',
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

    

    // Special handling for batches - attach items
    // Enhanced special handling for batches
if (data.productionBatches && data.productionBatchItems) {
  data.productionBatches = data.productionBatches.map(batch => {
    batch.items = data.productionBatchItems
      .filter(bi => bi.batch_id === batch.id)
      .map(bi => {
        const product = data.products.find(p => p.id === bi.product_id);
        const recipe = data.recipes.find(r => r.id === bi.recipe_id);
        return {
          id: bi.id,
          product_id: bi.product_id,
          product_name: product?.name,
          quantity: bi.quantity,
          produced_quantity: bi.produced_quantity,
          recipe_id: bi.recipe_id,
          recipe_name: recipe?.name,
          status: bi.status,
          notes: bi.notes,
          progress_notes: bi.progress_notes
        };
      });
    return batch;
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
    else  if (sheetName === 'Purchases') {
      // Save the main purchase record
      const purchaseData = {...data};
      delete purchaseData.items;
      const purchaseResponse = saveRecordToSheet(sheet, purchaseData);

      // Save purchase items
      const purchaseItemsSheet = ss.getSheetByName('PurchaseItems');
      if (!purchaseItemsSheet) throw new Error('PurchaseItems sheet not found');

      // Save each item
      data.items.forEach(item => {
        saveRecordToSheet(purchaseItemsSheet, {
          id: Utilities.getUuid(),
          purchase_id: purchaseResponse.id,
          item_id: item.item_id,
          quantity_ordered: item.quantity_ordered,
          quantity_received: 0,
          unit_price: item.unit_price,
          created_at: new Date(),
          updated_at: new Date()
        });
      });
    }   else {
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
    if (!sheet) throw new Error('Sheet ${sheetName} not found');

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
    throw new Error('Failed to delete from ${sheetName}: ${error.message}');
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

    return saveToSheet('InventoryMovements', {
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
/*
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
*/  
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
      throw new Error('No recipe found for product: ${item.product_id}');
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
    const requestSheet = getTransferRequestsSheet();
    const requestData = requestSheet.getDataRange().getValues();
    const requestHeaders = requestData[0];

    const requestRowIndex = requestData.findIndex((row, index) =>
      index > 0 && row[requestHeaders.indexOf('id')] === data.transfer_request_id
    );

    if (requestRowIndex === -1) {
      throw new Error('Transfer request not found');
    }

    const requestObj = {};
    requestHeaders.forEach((header, index) => {
      requestObj[header] = requestData[requestRowIndex][index];
    });

    const movementId = Utilities.getUuid();
    
    const movement = {
      id: movementId,
      transfer_request_id: data.transfer_request_id,
      transaction_type: 'Transfer',
      quantity: data.quantity,
      from_location: data.from_location,
      to_location: data.to_location,
      transfer_date: new Date(),
      transferred_by: Session.getActiveUser().getEmail(),
      notes: data.notes || '',
      item_type: requestObj.item_type,
      item_id: requestObj.item_id,
      batch_number: requestObj.batch_number,
      reference_id: requestObj.reference_id, // Added reference_id field
      created_at: new Date(),
      updated_at: new Date()
    };

    saveToSheet('InventoryMovements', movement);

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

    return getData();
  } catch (error) {
    throw new Error(`Failed to record transfer: ${error.message}`);
  }
}


// Add function to check if batch can start production
function checkBatchReadyForProduction(batchId) {
  const transfers = getTransferRequestsForBatch(batchId);
  const hasIngredients = transfers.some(t =>
    t.transferred_quantity > 0);

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

function confirmBatchIngredients(items) {
  try {    
    const results = [];
    
    for (const {transferId, quantity} of items) {
      const transfer = getTransferRequestDetails(transferId);
      if (!transfer) throw new Error('Transfer request not found');

      const currentStock = getIngredientInventory(transfer.item_id);
      if (currentStock < quantity) {
        throw new Error(`Insufficient stock. Only ${currentStock.toFixed(3)} ${transfer.unit} available`);
      }

      const result = recordPartialTransfer({
        transfer_request_id: transferId,
        quantity: Math.round(quantity * 1000) / 1000,
        from_location: 'main_storage',
        to_location: 'production',
        notes: 'Production batch receipt confirmation'
      });
      
      results.push(result);
    }

    if (items.length > 0) {
      const firstTransfer = getTransferRequestDetails(items[0].transferId);
      checkBatchIngredients(firstTransfer.reference_id);
    }

    return getData();
  } catch (error) {
    Logger.log('Error in confirmBatchIngredients: ' + error.message);
    throw error;
  }
}

function checkBatchIngredients(batchId) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const batchSheet = ss.getSheetByName('ProductionBatches');
    const data = batchSheet.getDataRange().getValues();
    const headers = data[0];
    const rowIndex = data.findIndex(row => row[headers.indexOf('id')] === batchId);

    // Check if all ingredients are received for this batch
    const transfers = getTransferRequestsForBatch(batchId);
    const allReceived = transfers.every(t =>
        t.transferred_quantity >= t.total_quantity
    );

    if (allReceived && rowIndex > 0) {
        const currentStatus = data[rowIndex][headers.indexOf('status')];
        // Only update if current status is 'ordered'
        if (currentStatus === 'ordered') {
            batchSheet.getRange(rowIndex + 1, headers.indexOf('status') + 1)
                .setValue('ready_for_production');
        }
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
      throw new Error('No recipe found for product: ${item.product_id}');
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
      errors.push('${field} is required');
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
    notes: 'Auto-created from Order #${orderId}'
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
    if (!data[field]) throw new Error('Missing required field: ${field}');
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
    throw new Error('Failed to update batch status: ${error.message}');
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

function getMultipleIngredientInventory(ingredientIds) {
    return ingredientIds.map(id => getIngredientInventory(id));
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
    notes: 'Created from Order #${orderId}',
    items: order.items.map(item => ({
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

  // Create ingredient transfer requests with optimized grouping
  const ingredientTotals = {};

 


// First, calculate total quantities needed for each ingredient
order.items.forEach(item => {
    const recipe = getRecipeForProduct(item.product_id);
    if (!recipe) throw new Error(`Recipe not found for product ${item.product_id}`);
    
    recipe.ingredients.forEach(ingredient => {
        const calculation = (ingredient.quantity * item.quantity) / recipe.yield;
        const requiredQuantity = Math.round(calculation * 1000) / 1000;
        
        // Sum up quantities for the same ingredient
        if (!ingredientTotals[ingredient.ingredient_id]) {
            ingredientTotals[ingredient.ingredient_id] = {
                ingredient_id: ingredient.ingredient_id,
                total_quantity: 0
            };
        }
        
        // Add with 3 decimal precision
        const newTotal = ingredientTotals[ingredient.ingredient_id].total_quantity + requiredQuantity;
        ingredientTotals[ingredient.ingredient_id].total_quantity = Math.round(newTotal * 1000) / 1000;
    });
});



  // Create one transfer request per ingredient with combined quantities
  Object.values(ingredientTotals).forEach(ingredientTotal => {
    const transferRequest = {
        request_type: 'ingredient_to_production',
        item_id: ingredientTotal.ingredient_id,
        item_type: 'ingredient',
        batch_number: createdBatch.batch_number,
        reference_id: createdBatch.id,
        total_quantity: ingredientTotal.total_quantity,
        transferred_quantity: 0,
        remaining_quantity: ingredientTotal.total_quantity,
        status: 'pending'
    };
    createTransferRequest(transferRequest);
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
    const newProducedQty = Math.round((currentItem.produced_quantity || 0) * 1000 + data.quantity_produced * 1000) / 1000;

    // Get recipe and record ingredient consumption
    const recipe = getRecipeForProduct(data.product_id);
    if (!recipe) throw new Error('Recipe not found');
    // Get batch details for batch number
    const batchesSheet = ss.getSheetByName('ProductionBatches');
    const batchData = batchesSheet.getDataRange().getValues();
    const batchHeaders = batchData[0];
    const batch = batchData.find((row, index) =>
      index > 0 && row[batchHeaders.indexOf('id')] === data.batch_id
    );

    // Get product details for unit price
    const productsSheet = ss.getSheetByName('Products');
    const productsData = productsSheet.getDataRange().getValues();
    const productsHeaders = productsData[0];
    const product = productsData.find((row, index) =>
      index > 0 && row[productsHeaders.indexOf('id')] === data.product_id
    );

    // Record in ProductionProgress
    const progress = {
      id: Utilities.getUuid(),
      batch_id: data.batch_id,
      product_id: data.product_id,
      quantity_produced: data.quantity_produced,
      created_at: new Date(),
      updated_at: new Date()
    };
    saveToSheet('ProductionProgress', progress);

    // Record ingredient consumption
    recipe.ingredients.forEach(ing => {
      const usedQuantity = (ing.quantity * data.quantity_produced) / recipe.yield;

      // Record ingredient usage
      const usage = {
        id: Utilities.getUuid(),
        production_progress_id: progress.id,
        ingredient_id: ing.ingredient_id,
        quantity: usedQuantity,
        batch_number: currentItem.batch_number,
        created_at: new Date(),
        updated_at: new Date()
      };
      saveToSheet('IngredientDetails', usage);

      // Record inventory transaction for ingredient consumption
      recordInventoryTransaction({
        item_type: 'ingredient',
        item_id: ing.ingredient_id,
        transaction_type: 'Consumption',
        quantity: usedQuantity,
        batch_number: batch[batchHeaders.indexOf('batch_number')],
        from_location: 'production',
        to_location: 'consumed',
        reference_type: 'production_consumed',
        reference_id: data.batch_id,
        notes: 'Ingredient consumed in production',

      });
    });

    // Record product production in inventory
    recordInventoryTransaction({
      item_type: 'Product',
      item_id: data.product_id,
      transaction_type: 'Production',
      quantity: data.quantity_produced,
      batch_number: batch[batchHeaders.indexOf('batch_number')],
      from_location: 'production',
      unit_price: product[productsHeaders.indexOf('cost_per_unit')] || 0,
      total_price: (product[productsHeaders.indexOf('cost_per_unit')] || 0) * data.quantity_produced,
      to_location: 'production_storage',
      reference_type: 'production',
      reference_id: data.batch_id,
      notes: `Production of ${data.quantity_produced} units completed`,

    });
    

    // Update batch item
    batchItemsSheet.getRange(batchItemRow + 1, batchItemsHeaders.indexOf('produced_quantity') + 1)
      .setValue(newProducedQty);

    if (newProducedQty >= currentItem.quantity) {
      batchItemsSheet.getRange(batchItemRow + 1, batchItemsHeaders.indexOf('status') + 1)
        .setValue('ready_for_transfer');
    } else {
      batchItemsSheet.getRange(batchItemRow + 1, batchItemsHeaders.indexOf('status') + 1)
        .setValue('in_production');
    }

    return getData();
  } catch (error) {
    throw new Error('Failed to record production progress: ${error.message}');
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
  const multiplier = 1000;
  return recipe.ingredients.map(ing => {
    const calculation = (ing.quantity * quantityProduced) / recipe.yield;
    return {
      ingredient_id: ing.ingredient_id,
      quantity_used: Math.round(calculation * multiplier) / multiplier
    };
  });
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

      return {
        ingredient_id: ing.ingredient_id,
        required: ing.required_quantity,
        available: available,
        sufficient: available >= ing.required_quantity
      };
    });

    // Check for insufficient quantities
    const insufficientIngredients = availabilityCheck.filter(check => !check.sufficient);
    if (insufficientIngredients.length > 0) {
      const errorMessages = insufficientIngredients.map(check =>
        `Insufficient quantity for ingredient ${check.ingredient_id}. Available: ${check.available}, Required: ${check.required}`
      );
      throw new Error(`Failed to check ingredient availability: ${errorMessages.join('; ')}`);
    }

    return {
      canProduce: availabilityCheck.every(check => check.sufficient),
      ingredients: availabilityCheck
    };
  } catch (error) {
    throw new Error('Failed to check ingredient availability: ${error.message}');
  }
}

/*
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

*/

/*
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
throw new Error(Failed to transfer finished products: ${error.message});
}
}

*/

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
    throw new Error('Failed to update product status: ${error.message}');
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

// 1. Enhanced getLocationInventory (UPDATE EXISTING)
function getLocationInventory(location, itemType, itemId) {
   console.log("Getting inventory for:", {location, itemType, itemId});
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let totalQuantity = 0;
  
  const movements = ss.getSheetByName('InventoryMovements');
  const data = movements.getDataRange().getValues();
  const headers = data[0];
    console.log("All movements:", data.slice(1));

  // First, let's get ALL movements that match our item, regardless of location
  const relevantMovements = data.slice(1).filter(row => {
    const rowItemId = row[headers.indexOf('item_id')];
    const rowItemType = row[headers.indexOf('item_type')];
    console.log("Checking movement:", {rowItemId, rowItemType, actual: {itemId, itemType}});
    return rowItemId === itemId && rowItemType === itemType;
  });

  // Now process each movement separately
  relevantMovements.forEach(row => {
    const fromLoc = row[headers.indexOf('from_location')];
    const toLoc = row[headers.indexOf('to_location')];
    const quantity = Math.round(Number(row[headers.indexOf('quantity')] || 0) * 1000) / 1000;

    
    // Process each location independently
    if (fromLoc === location) {
      totalQuantity -= quantity; // This is where items leave
    }
    if (toLoc === location) {
      totalQuantity += quantity; // This is where items arrive
    }
  });
  console.log("Relevant movements:", relevantMovements);
  return Math.round(totalQuantity * 1000) / 1000;

}


// 2. Enhanced transferFinishedProducts (UPDATE EXISTING)
function transferFinishedProducts(data) {
  try {
    if (!data.batch_id || !data.transfers || !data.transfers.length) {
      throw new Error('Invalid transfer data');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('Processing transfers:', data);

    // Get batch details
    const batchesSheet = ss.getSheetByName('ProductionBatches');
    const batchData = batchesSheet.getDataRange().getValues();
    const batchHeaders = batchData[0];
    const batch = batchData.find(row => row[batchHeaders.indexOf('id')] === data.batch_id);

    if (!batch) throw new Error('Batch not found');
    const batchNumber = batch[batchHeaders.indexOf('batch_number')];

    // Process each transfer
    data.transfers.forEach(transfer => {
      // Check available quantity
      const available = getLocationInventory('production_storage', 'Product', transfer.product_id);
      Logger.log('Available quantity:', available);

      if (available < transfer.quantity) {
        throw new Error(`Insufficient quantity. Available: ${available}, Requested: ${transfer.quantity}`);
      }

      // Create transfer request using existing function
      const transferRequest = createTransferRequest({
        request_type: 'production_to_showroom',
        item_id: transfer.product_id,
        item_type: 'Product',
        batch_number: batchNumber,
        total_quantity: transfer.quantity,
        transferred_quantity: 0,
        remaining_quantity: transfer.quantity,
        reference_id: data.batch_id,
        notes: 'Transfer to showroom'
      });

      // Record inventory transaction
      recordInventoryTransaction({
        item_type: 'Product',
        item_id: transfer.product_id,
        transaction_type: 'Transfer',
        quantity: transfer.quantity,
        batch_number: batchNumber,
        from_location: 'production_storage',
        to_location: 'showroom',
        reference_type: 'finished_product_transfer',
        reference_id: data.batch_id,
        transfer_request_id: transferRequest.id,
        notes: 'Transfer to showroom'
      });
/*
      finishedmovement ({
        id: Utilities.getUuid(),
        item_id: transfer.product_id,
        item_type: 'Product',
        transaction_type: 'Transfer',
        quantity: transfer.quantity,
        batch_number: batchNumber,
        reference_type: 'finished_product_transfer',
        reference_id: data.batch_id,
        notes: 'Transfer to showroom',
        from_location: 'production_storage',
        to_location: 'showroom',
        transfer_date: new Date(),
        transferred_by: Session.getActiveUser().getEmail(),transfer_request_id: data.transfer_request_id,  
        created_at: new Date(),
        updated_at: new Date()
    });
*/
     /* // Record transfer movement
      recordTransferMovement({
        transfer_request_id: transferRequest.id,
        quantity: transfer.quantity,
        from_location: 'production_storage',
        to_location: 'showroom',
        batch_number: batchNumber,
        notes: 'Product transfer to showroom'
      });
*/
      // Update batch item status
      updateBatchItemTransferStatus(data.batch_id, transfer);
    });

    return getData();
  } catch (error) {
    Logger.log('Error in transferFinishedProducts:', error);
    throw error;
  }
}

// 3. New recordTransferMovement function (NEW)
function recordTransferMovement(data) {
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

  saveToSheet('InventoryMovements', movement);
  return movement;
}
/*
function recordinventorymovement(data){

  const finishedmovement = {
      id: Utilities.getUuid(),
      item_id: transfer.product_id,
      item_type: 'Product',
      transaction_type: 'Transfer',
      quantity: transfer.quantity,
      batch_number: batchNumber,
      reference_type: 'finished_product_transfer',
      reference_id: data.batch_id,
      notes: 'Transfer to showroom',
      from_location: 'production_storage',
      to_location: 'showroom',
      transfer_date: new Date(),
      transferred_by: Session.getActiveUser().getEmail(),transfer_request_id: data.transfer_request_id,  
      created_at: new Date(),
      updated_at: new Date()
    };

    // Save movement
    saveToSheet('TransferRequest', finishedmovement);
    return finishedmovement;
}
*/
// 4. New updateBatchItemTransferStatus function (NEW)
function updateBatchItemTransferStatus(batchId, transfer) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('ProductionBatchItems');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Find the row index
  const rowIndex = data.findIndex(row => 
    row[headers.indexOf('batch_id')] === batchId &&
    row[headers.indexOf('product_id')] === transfer.product_id
  );

  if (rowIndex >= 0) { // Fix: Include the first row
    const targetQuantity = Number(data[rowIndex][headers.indexOf('quantity')] || 0);
    Logger.log(`Target Quantity for batch ${batchId}, product ${transfer.product_id}: ${targetQuantity}`);

    // Get all previous transfers
    const movements = ss.getSheetByName('InventoryMovements');
    const movementData = movements.getDataRange().getValues();
    const movementHeaders = movementData[0];

    let totalTransferred = 0;
    movementData.slice(1).forEach(row => {
      if (row[movementHeaders.indexOf('reference_id')] === batchId &&
          row[movementHeaders.indexOf('item_id')] === transfer.product_id &&
          row[movementHeaders.indexOf('to_location')] === 'showroom') {
        const quantity = Number(row[movementHeaders.indexOf('quantity')] || 0);
        Logger.log(`Found transfer: ${quantity} units`);
        totalTransferred += quantity;
      }
    });

    Logger.log(`Total Transferred before current transfer: ${totalTransferred}`);

    // Add current transfer
    if (typeof transfer.quantity !== 'number') { // Fix: Validate transfer quantity
      Logger.log('Invalid transfer quantity:', transfer.quantity);
      return;
    }
    /*totalTransferred += Number(transfer.quantity);*/
    Logger.log(`Total Transferred after current transfer: ${totalTransferred}`);

    // Update status if criteria are met
    const statusCol = headers.indexOf('status') + 1;
    if (totalTransferred >= targetQuantity) {
      Logger.log(`Criteria met: Total Transferred (${totalTransferred}) >= Target Quantity (${targetQuantity})`);
      sheet.getRange(rowIndex + 1, statusCol).setValue('transferred');
    } else {
      Logger.log(`Criteria not met: Total Transferred (${totalTransferred}) < Target Quantity (${targetQuantity})`);
    }

    // Update the updated_at column
    sheet.getRange(rowIndex + 1, headers.indexOf('updated_at') + 1).setValue(new Date());
  } else {
    Logger.log('No matching row found for batchId:', batchId, 'and product_id:', transfer.product_id);
  }
}



// Add this new helper function
function getInventoryMovementsForBatch(batchId, productId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const movements = ss.getSheetByName('InventoryMovements');
  const data = movements.getDataRange().getValues();
  const headers = data[0];

  let totalTransferred = 0;
  data.slice(1).forEach(row => {
    if (row[headers.indexOf('reference_id')] === batchId && 
        row[headers.indexOf('item_id')] === productId && 
        row[headers.indexOf('to_location')] === 'showroom') {
      totalTransferred += Number(row[headers.indexOf('quantity')] || 0);
    }
  });
  
  return totalTransferred;
}

function handleTransferComplete(batchId, transfer) {
    google.script.run
        .withSuccessHandler(() => {
            // Your existing success handling
        })
        .withFailureHandler((error) => {
            console.error('Failed to update status:', error);
        })
        .updateBatchItemTransferStatus(batchId, transfer);
}







function getTransferRequestsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('TransferRequests');
  if (!sheet) {
    throw new Error('TransferRequests sheet not found');
  }
  return sheet;
}
function findExistingBatch(batchId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const batchSheet = ss.getSheetByName('ProductionBatches');
  const data = batchSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) { // Start from 1 to skip headers
    if (data[i][0] === batchId) { // Assuming the batch ID is in the first column
      return data[i];
    }
  }
  return null;
}

function createProductionBatch(batchData) {
  validateBatchData(batchData);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const batchSheet = ss.getSheetByName('ProductionBatches');
  
  // Check if batch already exists
  const existingBatch = findExistingBatch(batchData.id);
  if (existingBatch) {
    return existingBatch;
  }

  const batchNumber = generateBatchNumber();
  const batch = {
    ...batchData,
    id: Utilities.getUuid(),
    batch_number: batchNumber,
    status: batchData.status || 'planned',
    notes: `Created from Order #${batchData.order_id}`,
    created_at: new Date(),
    updated_at: new Date()
  };

  const batchHeaders = batchSheet.getRange(1, 1, 1, batchSheet.getLastColumn()).getValues()[0];
  const batchRowData = batchHeaders.map(header => batch[header] || '');
  batchSheet.appendRow(batchRowData);

  if (batchData.items && batchData.items.length > 0) {
    const batchItemsSheet = ss.getSheetByName('ProductionBatchItems');
    const itemHeaders = batchItemsSheet.getRange(1, 1, 1, batchItemsSheet.getLastColumn()).getValues()[0];

    batchData.items.forEach(item => {
      if (!findExistingBatchItem(batch.id, item.product_id)) {
        const batchItem = {
          id: Utilities.getUuid(),
          batch_id: batch.id,
          product_id: item.product_id,
          quantity: item.quantity,
          produced_quantity: 0,
          status: 'pending',
          notes: '',
          progress_notes: '',
          created_at: new Date(),
          updated_at: new Date()
        };

        const itemRowData = itemHeaders.map(header => batchItem[header] || '');
        batchItemsSheet.appendRow(itemRowData);
      }
    });
  }

  return batch;
}


function prepareBatchData(batchData) {
  return {
    id: Utilities.getUuid(),
    status: batchData.status || 'planned',
    notes: `Created from Order #${batchData.order_id}`,
    created_at: new Date(),
    updated_at: new Date(),
    ...batchData
  };
}

function prepareBatchItems(batchId, items) {
  return items.map(item => ({
    id: Utilities.getUuid(),
    batch_id: batchId,
    product_id: item.product_id,
    quantity: item.quantity,
    produced_quantity: 0,
    recipe_id: item.recipe_id,
    status: 'pending',
    notes: '',
    progress_notes: '',
    created_at: new Date(),
    updated_at: new Date()
  }));
}

function executeOperations(operations) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  operations.forEach(op => {
    const sheet = ss.getSheetByName(op.sheet);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    if (Array.isArray(op.data)) {
      op.data.forEach(item => {
        const rowData = headers.map(header => item[header] || '');
        sheet.appendRow(rowData);
      });
    } else {
      const rowData = headers.map(header => op.data[header] || '');
      sheet.appendRow(rowData);
    }
  });
}


// Helper function to check for existing batch items
function findExistingBatchItem(batchId, productId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('ProductionBatchItems');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const batchIdCol = headers.indexOf('batch_id');
  const productIdCol = headers.indexOf('product_id');
  
  return data.slice(1).some(row => 
    row[batchIdCol] === batchId && 
    row[productIdCol] === productId
  );
}

function debugProductionData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const productionBatchesSheet = ss.getSheetByName('ProductionBatches');
  const productionDetailsSheet = ss.getSheetByName('ProductionBatchItems');
  
  const batchData = productionBatchesSheet.getDataRange().getValues();
  const detailsData = productionDetailsSheet.getDataRange().getValues();
  
  Logger.log('Production Batches:');
  Logger.log(batchData);
  Logger.log('Production Details:');
  Logger.log(detailsData);
  
  return {
    batches: batchData,
    details: detailsData
  };
}

function recordPurchaseReceival(data) {
  const { purchase_id, items } = data;
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const purchaseItemsSheet = ss.getSheetByName('PurchaseItems');
    const purchasesSheet = ss.getSheetByName('Purchases');

    items.forEach(item => {
      if (item.quantity_received <= 0) {
        throw new Error(`Invalid received quantity for ${item.item_name}`);
      }

      // Record in InventoryMovements
      recordInventoryTransaction({
        item_type: 'ingredient',
        item_id: item.item_id,
        transaction_type: 'in',
        quantity: item.quantity_received,
        batch_number: item.batch_number,
        from_location: 'supplier',
        to_location: 'main_storage',
        reference_type: 'purchase',
        reference_id: purchase_id,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity_received,
        notes: `Received from purchase ${purchase_id}`
      });

      // Update PurchaseItems
      const itemData = purchaseItemsSheet.getDataRange().getValues();
      const itemHeaders = itemData[0];
      const itemRow = itemData.findIndex(row => 
        row[itemHeaders.indexOf('purchase_id')] === purchase_id && 
        row[itemHeaders.indexOf('item_id')] === item.item_id
      );

      if (itemRow > 0) {
        const currentReceived = Number(itemData[itemRow][itemHeaders.indexOf('quantity_received')] || 0);
        const newReceived = currentReceived + Number(item.quantity_received);
        purchaseItemsSheet.getRange(itemRow + 1, itemHeaders.indexOf('quantity_received') + 1)
          .setValue(newReceived);
      }
    });

    // Update purchase status
    const purchaseData = purchasesSheet.getDataRange().getValues();
    const headers = purchaseData[0];
    const purchaseRow = purchaseData.findIndex(row => row[headers.indexOf('id')] === purchase_id);

    // Check if all items fully received
    const purchaseItems = purchaseItemsSheet.getDataRange().getValues();
    const itemHeaders = purchaseItemsSheet.getRange(1, 1, 1, purchaseItemsSheet.getLastColumn()).getValues()[0];
    const allReceived = purchaseItems
      .filter(row => row[itemHeaders.indexOf('purchase_id')] === purchase_id)
      .every(row => {
        const received = Number(row[itemHeaders.indexOf('quantity_received')] || 0);
        const ordered = Number(row[itemHeaders.indexOf('quantity_ordered')]);
        return received >= ordered;
      });

    const newStatus = allReceived ? 'received' : 'partially_received';
    purchasesSheet.getRange(purchaseRow + 1, headers.indexOf('status') + 1)
      .setValue(newStatus);
    purchasesSheet.getRange(purchaseRow + 1, headers.indexOf('actual_delivery') + 1)
      .setValue(new Date());

    return getData();
  } catch (error) {
    Logger.log('Error in recordPurchaseReceival:', error);
    throw error;
  }
}

function approvePurchase(purchaseId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const purchasesSheet = ss.getSheetByName('Purchases');
    const data = purchasesSheet.getDataRange().getValues();
    const headers = data[0];
    
    const purchaseRow = data.findIndex(row => row[headers.indexOf('id')] === purchaseId);
    if (purchaseRow === -1) throw new Error('Purchase not found');

    const approver = Session.getActiveUser().getEmail();

    purchasesSheet.getRange(purchaseRow + 1, headers.indexOf('status') + 1).setValue('approved');
    purchasesSheet.getRange(purchaseRow + 1, headers.indexOf('approval_date') + 1).setValue(new Date());
    purchasesSheet.getRange(purchaseRow + 1, headers.indexOf('approved_by') + 1).setValue(approver);

    return getData();
  } catch (error) {
    throw new Error('Failed to approve purchase: ' + error.message);
  }
}


function recordDailyCount(countData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get current system quantity
    const systemQty = getLocationInventory(
      countData.location, 
      countData.item_type, 
      countData.item_id
    );

    // Debug log
    Logger.log({
      type: countData.item_type,
      location: countData.location,
      systemQty: systemQty,
      counted: countData.counted_quantity,
      movements: getInventoryMovements(countData.item_id, countData.item_type)
    });

    // Calculate variance
    const variance = countData.counted_quantity - systemQty;
    const variancePercentage = (systemQty !== 0) ? (variance / systemQty) * 100 : 0;
    
    Logger.log('Variance calculation:', {
      counted: countData.counted_quantity,
      system: systemQty,
      variance: variance,
      percentage: variancePercentage
    });

    const stockCount = {
      id: Utilities.getUuid(),
      date: new Date().toISOString().split('T')[0],
      location: countData.location,
      item_id: countData.item_id,
      item_type: countData.item_type,
      counted_quantity: countData.counted_quantity,
      system_quantity: systemQty,
      variance: variance,
      variance_percentage: variancePercentage,
      notes: countData.notes || '',
      counted_by: Session.getActiveUser().getEmail(),
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    saveToSheet('DailyStockCounts', stockCount);
    
    Logger.log('Checking variance threshold:', Math.abs(variancePercentage) > 5);
    
    // If variance exceeds threshold, create alert
    if (Math.abs(variancePercentage) > 5) {
      Logger.log('Variance exceeds 5%, creating alert...');
      createVarianceAlert(stockCount);
    }
    
    Logger.log('Alert creation attempted');
    return getData();
  } catch (error) {
    Logger.log('Error in recordDailyCount: ' + error.message);
    throw new Error('Failed to record stock count: ' + error.message);
  }
}

function verifyStockCount(countId, verifierNotes) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DailyStockCounts');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const rowIndex = data.findIndex(row => row[headers.indexOf('id')] === countId);
  if (rowIndex === -1) throw new Error('Count record not found');

  sheet.getRange(rowIndex + 1, headers.indexOf('status') + 1).setValue('verified');
  sheet.getRange(rowIndex + 1, headers.indexOf('verified_by') + 1)
    .setValue(Session.getActiveUser().getEmail());
  if (verifierNotes) {
    sheet.getRange(rowIndex + 1, headers.indexOf('notes') + 1)
      .setValue(data[rowIndex][headers.indexOf('notes')] + '\nVerifier: ' + verifierNotes);
  }

  return getData();
}

function getDailyStockReport(date, location) {
  const counts = getSheetData('DailyStockCounts')
    .filter(count => 
      count.date === date &&
      (!location || count.location === location)
    );

  const report = {
    date: date,
    location: location,
    total_items_counted: counts.length,
    total_variances: counts.filter(c => c.variance !== 0).length,
    items: counts.map(count => {
      const item = count.item_type === 'product' 
        ? getProductById(count.item_id)
        : getIngredientById(count.item_id);
      
      return {
        ...count,
        item_name: item ? item.name : 'Unknown',
        unit: item ? item.unit : ''
      };
    })
  };

  return report;
}

function createVarianceAlert(stockCount) {
  try {
    let item;
    if (stockCount.item_type === 'Product') {
      item = getProductById(stockCount.item_id);
    } else if (stockCount.item_type === 'Ingredient') {
      item = getIngredientById(stockCount.item_id);
    }

    if (!item) {
      Logger.log('Item not found for alert creation. Item ID: ' + stockCount.item_id);
      // Create an alert with a placeholder name if the item is not found
      item = {
        name: 'Unknown Item',
        unit: 'N/A'
      };
    }

    const alertData = {
      id: Utilities.getUuid(),
      date: stockCount.date,
      item_id: stockCount.item_id,
      item_type: stockCount.item_type,
      location: stockCount.location,
      variance: stockCount.variance,
      variance_percentage: stockCount.variance_percentage,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
      item_name: item.name, // Include item name in the alert
      unit: item.unit // Include unit in the alert
    };

    Logger.log('Creating alert with data:', alertData);
    saveToSheet('StockAlerts', alertData);
  } catch (error) {
    Logger.log('Error in createVarianceAlert: ' + error.message);
    throw error;
  }
}

function getInventoryMovements(itemId, itemType) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const movements = ss.getSheetByName('InventoryMovements');
  if (!movements) return [];
  
  const data = movements.getDataRange().getValues();
  const headers = data[0];
  
  return data.slice(1)
    .filter(row => 
      row[headers.indexOf('item_id')] === itemId && 
      row[headers.indexOf('item_type')] === itemType
    )
    .map(row => ({
      quantity: row[headers.indexOf('quantity')],
      from: row[headers.indexOf('from_location')],
      to: row[headers.indexOf('to_location')]
    }));
}


function getIngredientById(ingredientId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Ingredients');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  
  const row = data.find((row, index) => index > 0 && row[idIndex] === ingredientId);
  
  if (!row) return null;
  
  const ingredient = {};
  headers.forEach((header, index) => {
    ingredient[header] = row[index];
  });
  
  return ingredient;
}

function getProductById(productId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  
  const row = data.find((row, index) => index > 0 && row[idIndex] === productId);
  
  if (!row) return null;
  
  const product = {};
  headers.forEach((header, index) => {
    product[header] = row[index];
  });
  
  return product;
}

function getOrderIngredients(orderId) {
  const order = getOrderDetails(orderId);
  if (!order) throw new Error('Order not found');

  const ingredients = {};

  order.items.forEach(item => {
    const recipe = getRecipeForProduct(item.product_id);
    if (!recipe) throw new Error(`Recipe not found for product ${item.product_id}`);

    recipe.ingredients.forEach(ing => {
      // Calculate required quantity and round to 3 decimal places
      const requiredQty = Math.round(((ing.quantity * item.quantity) / recipe.yield) * 1000) / 1000;
      
      if (!ingredients[ing.ingredient_id]) {
        const ingredient = getIngredientDetails(ing.ingredient_id);
        ingredients[ing.ingredient_id] = {
          name: ingredient.name,
          unit: ingredient.unit,
          quantity: 0
        };
      }
      // Add the rounded quantity
      ingredients[ing.ingredient_id].quantity = Math.round((ingredients[ing.ingredient_id].quantity + requiredQty) * 1000) / 1000;
    });
  });

  return JSON.stringify(Object.values(ingredients));
}


function testVarianceAlert() {
  recordDailyCount({
    location: 'showroom',
    item_type: 'Product', 
    item_id: '6f7a9a63-40d9-494f-9b4a-a260c5a2c966', // Real product ID
    counted_quantity: 100,
    notes: 'Test variance'
  });
}


function testTransferFinishedProducts() {
  // Sample data to simulate a transfer
  const testData = {
    batch_id: 'bfe3359b-7f94-4cb8-97f8-0c5b35d5635a', // Replace with a valid batch ID
    transfers: [
      {
        product_id: '9af3f639-f0bc-4725-9e22-dcad87daa6d5', // Replace with a valid product ID
        quantity: 0.2 // Quantity to transfer
      }
    ]
  };

  // Call the function to test
  transferFinishedProducts(testData);

  // Log completion
  Logger.log('Test function completed. Check logs for details.');
}

function testUpdateBatchItemTransferStatus() {
  // Sample data for testing
  const batchId = 'bfe3359b-7f94-4cb8-97f8-0c5b35d5635a'; // Replace with a valid batch ID from your sheet
  const transfer = {
    product_id: '9af3f639-f0bc-4725-9e22-dcad87daa6d5', // Replace with a valid product ID from your sheet
    quantity: .2 // Quantity being transferred
  };

  // Call the function to test
  updateBatchItemTransferStatus(batchId, transfer);

  // Log completion
  Logger.log('Test function completed. Check logs for details.');
}