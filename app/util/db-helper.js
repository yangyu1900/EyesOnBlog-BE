module.exports.parseQuery = function (tableName, queryStr) {
    const parsedQuery = {};

    const subject = {};
    subject['tableName'] = tableName;
    if (queryStr['metric'] && queryStr['metric'].length != 0) subject['metric'] = queryStr['metric'];
    if (queryStr['aggregation'] && queryStr['aggregation'].length != 0) subject['aggregation'] = queryStr['aggregation'];

    const conditions = {};
    if (queryStr['filterBy'] && queryStr['filterByValue']) {
        conditions['equals'] = [];
        conditions['contains'] = [];
        conditions['greaterThans'] = [];
        conditions['lessThans'] = [];

        const filterBy = queryStr['filterBy'];
        var filterBys = [];
        if (typeof (filterBy) == 'string') filterBys.push(filterBy); else if (filterBy) filterBys = filterBy;
        const filterByValue = queryStr['filterByValue'];
        var filterByValues = [];
        if (typeof (filterByValue) == 'string') filterByValues.push(filterByValue); else if (filterByValue) filterByValues = filterByValue;

        filterBys.forEach((fb, index) => {
            const fbv = filterByValues[index];
            const fbvArr = fbv.split(',');
            const numOfValues = fbvArr.length;
            if (numOfValues == 1) {
                if (fbv.indexOf('\'') > -1) {
                    const contain = {};
                    contain[fb] = fbv.replaceAll('\'', '');
                    conditions['contains'].push(contain);
                } else {
                    const equal = {};
                    equal[fb] = Number.parseInt(fbv)
                    conditions['equals'].push(equal);
                }
            } else {
                if (fbv.indexOf('\'') > -1) {
                    fbvArr.forEach((val) => {
                        const contain = {};
                        contain[fb] = val.replaceAll('\'', '');
                        conditions['contains'].push(contain);
                    })
                } else {
                    const greaterThan = {};
                    const lessThan = {};
                    greaterThan[fb] = fbvArr[0];
                    lessThan[fb] = fbvArr[1];
                    conditions['greaterThans'].push(greaterThan);
                    conditions['lessThans'].push(lessThan);
                }
            }
        });
    }

    if (queryStr['groupBy']) {
        conditions['groupBys'] = [];
        const groupBy = queryStr['groupBy'];
        if (typeof (groupBy) == 'string') conditions['groupBys'].push(groupBy); else if (groupBy) conditions['groupBys'] = groupBy;
        conditions['groupByUnits'] = [];
        const groupByUnits = queryStr['groupByUnit'];
        if (typeof (groupByUnits) == 'string') conditions['groupByUnits'].push(groupByUnits); else if (groupByUnits) conditions['groupByUnits'] = groupByUnits;
    }

    const options = {};
    if (queryStr['orderBy'] && queryStr['orderByOrder']) {
        options['sort'] = {};
        var orderBys =  [];
        typeof(queryStr['orderBy']) == 'string' ? orderBys.push(queryStr['orderBy']) : orderBys = queryStr['orderBy'];
        var orderByOrders = [];
        typeof(queryStr['orderByOrder']) == 'string' ? orderByOrders.push(queryStr['orderByOrder']) : orderByOrders=queryStr['orderByOrder'];
        orderBys.forEach((orderBy, index) => options.sort[orderBy] = Number.parseInt(orderByOrders[index]));
    }

    if (queryStr['skip']) options['skip'] = Number.parseInt(queryStr['skip']);
    if (queryStr['limit']) options['limit'] = Number.parseInt(queryStr['limit']);

    parsedQuery['subject'] = subject;
    parsedQuery['conditions'] = conditions;
    parsedQuery['options'] = options;

    return parsedQuery;
}