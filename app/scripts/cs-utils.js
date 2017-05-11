var FilterBuilderUtils = function(val) {
    this._value = val;
};

FilterBuilderUtils.prototype.property = function(path) {
    var props = path.split(/\./g);

    for(var i=0, len=props.length; i < len; i++) {
        if(!this._value) return this;

        this._value = this._value[props[i]];
    }

    return this;
};

FilterBuilderUtils.prototype.val = function() {
    return this._value;
};

FilterBuilderUtils.prototype.lower = function() {
    if(this._value) {
        this._value = this._value.toLowerCase();
    }

    return this;
};

FilterBuilderUtils.prototype.contains = function(val) {
    if(this._value) {
        return this._value.toLowerCase().match(val.toLowerCase());
    }

    return false;
};

var ConditionalListBuilder = function() {
    this._internalList = [];

    this.add = function(elem, condition) {
        if(_.isUndefined(condition) || condition) {
            this._internalList.push(elem);
        }

        return this;
    };

    this.getList = function() {
        return this._internalList;
    };
};