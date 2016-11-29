'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы mapLimit и filterLimit
 */
exports.isStar = true;

/**
 * Последовательное выполнение операций
 * @param {Function[]} operations – функции для выполнения
 * @param {Function} callback
 */
exports.serial = function (operations, callback) {
    var operationIndex = 0;

    function innerCallback(err, data) {
        if (err) {
            callback(err);
        }

        operationIndex++;

        if (operationIndex < operations.length) {
            operations[operationIndex](data, innerCallback);
        } else {
            callback(null, data);
        }
    }

    operations[operationIndex](innerCallback);
};

function Worker(items, operation, callback, convert) {
    this.items = items;
    this.operation = operation;
    this.callback = callback;
    this.convert = convert;

    this.results = [];
    this.countOfProcessedItems = 0;
    this.i = 0;
    this.finished = false;
}

Worker.prototype.parallelize = function (itemIndex) {
    var _this = this;
    this.operation(this.items[itemIndex], function (err, data) {
        _this.recursiveСallback(err, data, itemIndex);
    });
};

Worker.prototype.recursiveСallback = function (err, data, resultIndex) {
    if (!this.finished && err) {
        this.finished = true;
        this.callback(err);
    }

    if (!this.finished) {
        if (this.i < this.items.length) {
            this.parallelize(this.i);
            this.i++;
        }

        this.results[resultIndex] = data;
        this.countOfProcessedItems++;

        if (this.countOfProcessedItems === this.items.length) {
            this.finished = true;
            this.callback(null, this.convert(this.results));
        }
    }
};

Worker.prototype.startWork = function (limit) {
    for (var i = 0; i < Math.min(limit, this.items.length); i++) {
        this.parallelize(i);
    }

    this.i = limit;
};

/**
 * Параллельная обработка элементов
 * @param {Array} items – элементы для итерации
 * @param {Function} operation – функция для обработки элементов
 * @param {Function} callback
 */
exports.map = function (items, operation, callback) {
    var worker = new Worker(items, operation, callback, function (result) {
        return result;
    });

    worker.startWork(Infinity);
};

function getFilteredItems(items, array) {
    var v = [];

    for (var i = 0; i < array.length; i++) {
        if (array[i]) {
            v.push(items[i]);
        }
    }

    return v;
}

/**
 * Параллельная фильтрация элементов
 * @param {Array} items – элементы для фильтрация
 * @param {Function} operation – функция фильтрации элементов
 * @param {Function} callback
 */
exports.filter = function (items, operation, callback) {
    var worker = new Worker(items, operation, callback, function (result) {
        return getFilteredItems(items, result);
    });

    worker.startWork(Infinity);
};

/**
 * Асинхронизация функций
 * @param {Function} func – функция, которой суждено стать асинхронной
 * @returns {Function}
 */
exports.makeAsync = function (func) {
    return function () {
        var callback = arguments[arguments.length - 1];
        var args = [].slice.call(arguments, 0, arguments.length - 1);

        setTimeout(function () {
            var error = null;
            var result;

            try {
                result = func.apply(null, args);
            } catch (e) {
                error = e;
            }

            callback(error, result);
        }, 0);
    };
};

/**
 * Параллельная обработка элементов с ограничением
 * @star
 * @param {Array} items – элементы для итерации
 * @param {Number} limit – максимальное количество выполняемых параллельно операций
 * @param {Function} operation – функция для обработки элементов
 * @param {Function} callback
 */
exports.mapLimit = function (items, limit, operation, callback) {
    var worker = new Worker(items, operation, callback, function (array) {
        return array;
    });

    worker.startWork(limit);
};

/**
 * Параллельная фильтрация элементов с ограничением
 * @star
 * @param {Array} items – элементы для итерации
 * @param {Number} limit – максимальное количество выполняемых параллельно операций
 * @param {Function} operation – функция для обработки элементов
 * @param {Function} callback
 */
exports.filterLimit = function (items, limit, operation, callback) {
    var worker = new Worker(items, operation, callback, function (result) {
        return getFilteredItems(items, result);
    });

    worker.startWork(limit);
};