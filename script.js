document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('display');
    const historyDisplay = document.getElementById('history-display');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');
    const keypad = document.querySelector('.keypad');
    const degRadToggle = document.getElementById('deg-rad-toggle');

    let memory = 0;
    let isRadian = true;
    let history = [];

    // --- Event Listeners ---
    keypad.addEventListener('click', onKeyPress);
    display.addEventListener('keydown', onDisplayKeyDown);
    clearHistoryBtn.addEventListener('click', clearHistory);
    historyList.addEventListener('click', onHistoryClick);
    degRadToggle.addEventListener('change', () => {
        isRadian = degRadToggle.checked;
    });

    // --- Keyboard and Button Handling ---
    function onKeyPress(event) {
        if (!event.target.matches('.key')) return;
        const key = event.target.dataset.key;
        handleInput(key);
    }

    function onDisplayKeyDown(event) {
        event.preventDefault();
        handleInput(event.key);
    }

    function handleInput(key) {
        if (key === '=' || key === 'Enter') {
            evaluateExpression();
        } else if (key === 'C' || key === 'Escape') {
            clearDisplay();
        } else if (key === 'Backspace') {
            display.value = display.value.slice(0, -1);
        } else if (key === 'm+' || key === 'm-' || key === 'mc' || key === 'mr') {
            handleMemory(key);
        } else {
            display.value += key;
        }
    }
    
    // --- Evaluation ---
    function evaluateExpression() {
        const expression = display.value;
        try {
            const result = parseAndEvaluate(expression);
            historyDisplay.textContent = expression + ' =';
            display.value = result;
            addToHistory(expression, result);
        } catch (error) {
            display.value = error.message;
        }
    }

    // --- Expression Parser (Shunting-Yard based) ---
    function parseAndEvaluate(expr) {
        const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
        const functions = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt', 'fact'];

        const tokens = tokenize(expr);
        const outputQueue = [];
        const operatorStack = [];

        tokens.forEach(token => {
            if (!isNaN(token) || token === 'π' || token === 'e' || token === 'i') {
                outputQueue.push(token === 'π' ? Math.PI : token === 'e' ? Math.E : token);
            } else if (functions.includes(token)) {
                operatorStack.push(token);
            } else if (token === '(') {
                operatorStack.push(token);
            } else if (token === ')') {
                while (operatorStack.length && operatorStack[operatorStack.length - 1] !== '(') {
                    outputQueue.push(operatorStack.pop());
                }
                operatorStack.pop(); // Pop '('
                if (functions.includes(operatorStack[operatorStack.length - 1])) {
                    outputQueue.push(operatorStack.pop());
                }
            } else { // Operator
                while (operatorStack.length && precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]) {
                    outputQueue.push(operatorStack.pop());
                }
                operatorStack.push(token);
            }
        });

        while (operatorStack.length) {
            outputQueue.push(operatorStack.pop());
        }

        return evaluatePostfix(outputQueue);
    }

    function tokenize(expr) {
        // A more robust tokenizer is needed for production. This is a simplified version.
        return expr.match(/(\d+\.?\d*|[\+\-\*\/\^\(\)]|sin|cos|tan|asin|acos|atan|log|ln|sqrt|fact|π|e|i)/g) || [];
    }

    function evaluatePostfix(postfix) {
        const stack = [];
        postfix.forEach(token => {
            if (!isNaN(token)) {
                stack.push(parseFloat(token));
            } else {
                const b = stack.pop();
                let a;
                if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt', 'fact'].includes(token)) {
                    a = b;
                } else {
                    a = stack.pop();
                }

                stack.push(applyOperator(token, a, b));
            }
        });
        return stack[0];
    }
    
    function applyOperator(op, a, b) {
        const angle = val => isRadian ? val : (val * Math.PI / 180);
        const invAngle = val => isRadian ? val : (val * 180 / Math.PI);

        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return a / b;
            case '^': return Math.pow(a, b);
            case 'sin': return Math.sin(angle(a));
            case 'cos': return Math.cos(angle(a));
            case 'tan': return Math.tan(angle(a));
            case 'asin': return invAngle(Math.asin(a));
            case 'acos': return invAngle(Math.acos(a));
            case 'atan': return invAngle(Math.atan(a));
            case 'log': return Math.log10(a);
            case 'ln': return Math.log(a);
            case 'sqrt': return Math.sqrt(a);
            case 'fact': return factorial(a);
            default: throw new Error('Invalid operator');
        }
    }

    function factorial(n) {
        if (n < 0 || n % 1 !== 0) throw new Error('Invalid factorial');
        if (n === 0) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }


    // --- Memory and History ---
    function handleMemory(key) {
        const currentValue = parseFloat(display.value) || 0;
        if (key === 'm+') memory += currentValue;
        if (key === 'm-') memory -= currentValue;
        if (key === 'mc') memory = 0;
        if (key === 'mr') display.value = memory;
    }

    function addToHistory(expression, result) {
        history.unshift({ expression, result });
        if (history.length > 50) history.pop();
        renderHistory();
    }

    function renderHistory() {
        historyList.innerHTML = history.map(item => `<li>${item.expression} = ${item.result}</li>`).join('');
    }

    function clearHistory() {
        history = [];
        renderHistory();
    }
    
    function onHistoryClick(event) {
        if (!event.target.matches('li')) return;
        display.value = event.target.textContent.split('=')[0].trim();
    }
    
    function clearDisplay() {
        display.value = '';
        historyDisplay.textContent = '';
    }
});
