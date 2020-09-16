var budgetController = (function () {
    var Expense = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage = function(totalIncome){

        if(totalIncome > 0){
            this.percentage = Math.round( (this.value / totalIncome) * 100 );
        }else{
            this.percentage = -1;
        }

    };

    Expense.prototype.getPercentage = function(){
        return this.percentage
    };

    var Income = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var calculateTotal = function (type) {
        var sum = 0;
        data.allItems[type].forEach(function (current) {
            sum += current.value;
        });
        data.total[type] = sum;
    };

    var fetchLocalData = function(localData){
        
        // Process all expense entries
        data.allItems.exp = localData.allItems.exp.map((expense)=>{
            let exp = new Expense(expense.id, expense.description, expense.value);
            exp.calcPercentage(localData.total.inc);
            return exp;
        });

        // Process all income entries
        data.allItems.inc = localData.allItems.inc.map(income => new Income(income.id, income.description, income.value));

        // Calculate total income and expenses
        calculateTotal('inc');
        calculateTotal('exp');

        // Calculate the budget : income - expense
        data.budget = data.total.inc - data.total.exp;

        // Calculate the percentage of income that we spent
        if (data.total.inc > 0)
            data.percentage = Math.round((data.total.exp / data.total.inc) * 100);
        else
            data.percentage = -1;

        return data;
    }
    
    var updateLocalDataObj = function (){
        let localString = JSON.stringify(data)
        localStorage.setItem("localBudget",localString);
        // For debug purpose:
        // console.log("Data:",data)
        // console.log("Local:",localStorage.getItem("localBudget"));
    };

    var data = {
        allItems: {
            exp: [],
            inc: [],
        },
        total: {
            exp: 0,
            inc: 0,
        },

        budget: 0,

        percentage: 0

    };

    return {
        preFetchData: function(data){
            return fetchLocalData(data);
        },
        clearLocalData: function(){
            localStorage.clear();
            window.location.reload();
        },
        addItem: function (type, des, val) {
            var newItem, ID;

            // ID = Last id + 1
            // Create new ID
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }

            // Create new item based on 'inc' or 'exp' type
            if (type === "exp") {
                newItem = new Expense(ID, des, val);
            } else if (type === "inc") {
                newItem = new Income(ID, des, val);
            }

            // Push it into our data structure
            data.allItems[type].push(newItem);

            // Updating Locally stored data on every operation
            updateLocalDataObj();

            // Return the new element
            return newItem;
        },

        deleteItem: function(type, id){
            var ids, index;

            ids = data.allItems[type].map(function(current){
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1){
                data.allItems[type].splice(index,1);
            }
            
            // Updating Locally stored data on every operation
            updateLocalDataObj();
        },

        calculateBudget: function () {

            // Calculate total income and expenses
            calculateTotal('inc');
            calculateTotal('exp');

            // Calculate the budget : income - expense
            data.budget = data.total.inc - data.total.exp;

            // Calculate the percentage of income that we spent

            if (data.total.inc > 0) {
                data.percentage = Math.round((data.total.exp / data.total.inc) * 100);
            } else {
                data.percentage = -1;
            }

            // Updating Locally stored data on every operation
            updateLocalDataObj();
        },

        calculatePercentage: function(){
            data.allItems.exp.forEach(function(cur){
                cur.calcPercentage(data.total.inc);
            });
            // Updating Locally stored data on every operation
            updateLocalDataObj();
        },

        getPercentages: function(){
            var allPerc = data.allItems.exp.map(function(cur){
                return cur.getPercentage();
            });

            return allPerc;
        },

        getBudget: function () {
            return {
                budget: data.budget,
                percentage: data.percentage,
                totalInc: data.total.inc,
                totalExp: data.total.exp
            };
        },

        testing: function () {
            console.log(data);
        },
    };
})();

var UIController = (function () {
    var DOMstrings = {
        inputType: ".add__type",
        inputDescription: ".add__description",
        inputValue: ".add__value",
        inputBtn: ".add__btn",
        incomeContainer: ".income__list",
        expenseContainer: ".expenses__list",
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expenseLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensePercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    };

    var formatNumber = function(num, type){
        var numSplit,int,dec;

        num = Math.abs(num);
        num = num.toFixed(2);

        numSplit = num.split('.');

         // Add commas to numbers recursively
         function addComma(integer) {

            if (integer.length <= 3) {
                return integer;
            } else {
                return addComma(integer.substring(0, integer.length - 3))+ ',' + integer.substr(integer.length - 3, integer.length); // input -> 23510, output -> 23,510
            }

        }

        // if(int.length > 3){
        //     int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
        // }

        int = addComma(numSplit[0]);

        dec = numSplit[1];

        return (type === 'inc' ? "+ " : "- ") + int + '.' + dec;

    };

    var nodeListForEach = function(list, callback){

        for( var i = 0; i<list.length; i++){
            callback(list[i], i);
        }

    };

    return {

        getInput: function () {
            return {
                type: document.querySelector(DOMstrings.inputType).value, // We will get inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value),
            };
        },

        addListItem: function (obj, type) {
            var html, newHtml, element;

            // Create HTML string with placeholder text

            if (type === "inc") {
                element = DOMstrings.incomeContainer;

                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === "exp") {
                element = DOMstrings.expenseContainer;

                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            }

            // Replace the placeholder string with some actual data

            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%',formatNumber(obj.value, type));

            // Insert the HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);

        },

        deleteListItem: function(selectorID){

            var el = document.getElementById(selectorID);

            el.parentNode.removeChild(el);

        },

        clearFields: function () {
            var fields, fieldsArr;

            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);

            fieldsArr = Array.prototype.slice.call(fields);

            fieldsArr.forEach(function (current, index, array) {
                current.value = "";
            });

            fieldsArr[0].focus();

        },

        displayBudget: function(obj){
            var type;
            obj.budget >= 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expenseLabel).textContent = formatNumber(obj.totalExp, 'exp');
            if(obj.percentage > 0){
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + "%" ;
            }else{
                document.querySelector(DOMstrings.percentageLabel).textContent = "---";
            }
            
        },

        displayPercentages: function(percentage){

            var fields = document.querySelectorAll(DOMstrings.expensePercLabel);

            nodeListForEach(fields, function(current, index){

                if(percentage[index] > 0){
                    current.textContent = percentage[index] + "%";
                }else{
                    current.textContent = "---";
                }
            });

        },

        displayMonth: function(){
            var now, month, months, year;

            now = new Date();

            month = now.getMonth();

            year = now.getUTCFullYear();

            months = ['January' , 'February' , 'March' , 'April' , 'May' , 'June' , 'July' , 'August' , 'September' , 'October' , 'November' , 'December'];

            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;

        },

        changeType: function(){

            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' + 
                DOMstrings.inputDescription + ',' + 
                DOMstrings.inputValue);

            nodeListForEach(fields, function(cur){
                cur.classList.toggle("red-focus");
            });

            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');


        },

        getDOMstrings: function () {
            return DOMstrings;
        },
        
        prepareUI: function(data){

            // Process all expense entries and their percentages
            let percentages = [];
            data.allItems.exp.forEach( expense => {
                percentages.push(expense.percentage);
                this.addListItem(expense, "exp");
            });
            this.displayPercentages(percentages);
    
            // Process all income entries
            data.allItems.inc.forEach( income => UIController.addListItem(income, "inc") );
            
            // Display budget
            this.displayBudget({
                budget: data.budget,
                percentage: data.percentage,
                totalInc: data.total.inc,
                totalExp: data.total.exp
            });
        }
    };
})();

var Controller = (function (budgetCtrl, UICtrl) {
    var setupEventListeners = function () {
        var DOM = UICtrl.getDOMstrings();

        document.querySelector(DOM.inputBtn).addEventListener("click", ctrlAddItem);

        document.addEventListener("keypress", function (event) {
            if (event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });

        document.querySelector(DOM.container).addEventListener("click",ctrlDeleteItem);

        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changeType);
    };

    var updateBudget = function () {

        // 1. Calculate the budget
        budgetCtrl.calculateBudget();

        // 2. Return the budget
        var budget = budgetCtrl.getBudget();
        
        // 3. Update the UI
        UICtrl.displayBudget(budget);
    };

    var updatePercentages = function(){
        
        // 1. Calculate the percentages
        budgetCtrl.calculatePercentage();

        // 2. Read the percentages from the budget controller
        var percentage = budgetCtrl.getPercentages();

        // 3. Update the UI
        UICtrl.displayPercentages(percentage);


    }

    var ctrlAddItem = function () {
        var input, newItem;

        // 1. Get input values
        input = UICtrl.getInput();

        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {

            // 2. Add new item to our data structure
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            // 3. Add new item to UI
            UICtrl.addListItem(newItem, input.type);

            // 4. Clear Input Fields 
            UICtrl.clearFields();

            // 5. Calculate and Update budget
            updateBudget();

            // 6. Calculate and update Percentages
            updatePercentages();

        }

    };

    var ctrlDeleteItem = function(event){
        var itemID, splitID, type, ID;

        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

        if(itemID){
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]);

            // 1. Delete item from data structure
            budgetCtrl.deleteItem(type, ID);

            // 2. Delete item from the UI
            UICtrl.deleteListItem(itemID);

            // 3. Update and show the new budget
            updateBudget();

            // 4. Calculate and update Percentages
            updatePercentages();
        }
    }

    return {
        init: function () {
            console.log("Application has been started");
            UICtrl.displayBudget({
                budget: 0,
                percentage: -1,
                totalInc: 0,
                totalExp: 0
            });
            UICtrl.displayMonth();
            setupEventListeners();

            // Fetch previous data
            let localStorageString = localStorage.getItem("localBudget");
            if(localStorageString){
                let localData = JSON.parse(localStorageString);
                let preparedData = budgetCtrl.preFetchData(localData);
                UICtrl.prepareUI(preparedData);
                console.log("Locally stored data:",localData);
            }else
                console.log("Couldn't find any local data !");
            
        },
    };
})(budgetController, UIController);

Controller.init();


function clearEverything(){
    if(confirm("This will clear all the data on this page permanently\n Are you sure?"))
        budgetController.clearLocalData();
}