'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /* eslint-disable */
/**
 * @file domhandler
 * @author https://github.com/fb55/domhandler
 * @modify tanghao03
 * @date 2018/5/17
 */

var _domelementtype = require('domelementtype');

var _domelementtype2 = _interopRequireDefault(_domelementtype);

var _node = require('./lib/node.js');

var _node2 = _interopRequireDefault(_node);

var _element = require('./lib/element.js');

var _element2 = _interopRequireDefault(_element);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var re_whitespace = /\s+/g;

function DomHandler(callback, options, elementCB) {
    if ((typeof callback === 'undefined' ? 'undefined' : _typeof(callback)) === 'object') {
        elementCB = options;
        options = callback;
        callback = null;
    } else if (typeof options === 'function') {
        elementCB = options;
        options = defaultOpts;
    }
    this._callback = callback;
    this._options = options || defaultOpts;
    this._elementCB = elementCB;
    this.dom = [];
    this._done = false;
    this._tagStack = [];
    this._parser = this._parser || null;
}

//default options
var defaultOpts = {
    normalizeWhitespace: false, //Replace all whitespace with single spaces
    withStartIndices: false, //Add startIndex properties to nodes
    withEndIndices: false //Add endIndex properties to nodes
};

DomHandler.prototype.onparserinit = function (parser) {
    this._parser = parser;
};

//Resets the handler back to starting state
DomHandler.prototype.onreset = function () {
    DomHandler.call(this, this._callback, this._options, this._elementCB);
};

//Signals the handler that parsing is done
DomHandler.prototype.onend = function () {
    if (this._done) return;
    this._done = true;
    this._parser = null;
    this._handleCallback(null);
};

DomHandler.prototype._handleCallback = DomHandler.prototype.onerror = function (error) {
    if (typeof this._callback === 'function') {
        this._callback(error, this.dom);
    } else {
        if (error) throw error;
    }
};

DomHandler.prototype.onclosetag = function (name, isSelfClose) {
    //if(this._tagStack.pop().name !== name) this._handleCallback(Error('Tagname didn't match!'));
    var elem = this._tagStack.pop();
    elem.selfclose = !!isSelfClose;
    if (this._options.withEndIndices && elem) {
        elem.endIndex = this._parser.endIndex;
    }
    if (this._elementCB) this._elementCB(elem);
};

DomHandler.prototype._createDomElement = function (properties) {
    if (!this._options.withDomLvl1) return properties;

    var element = void 0;
    if (properties.type === 'tag') {
        element = Object.create(_element2.default);
    } else {
        element = Object.create(_node2.default);
    }

    for (var key in properties) {
        if (properties.hasOwnProperty(key)) {
            element[key] = properties[key];
        }
    }

    return element;
};

DomHandler.prototype._addDomElement = function (element) {
    var parent = this._tagStack[this._tagStack.length - 1];
    var siblings = parent ? parent.children : this.dom;
    var previousSibling = siblings[siblings.length - 1];

    // element.next = null;

    if (this._options.withStartIndices) {
        element.startIndex = this._parser.startIndex;
    }
    if (this._options.withEndIndices) {
        element.endIndex = this._parser.endIndex;
    }

    // if(previousSibling){
    // 	element.prev = previousSibling;
    // 	previousSibling.next = element;
    // } else {
    // 	element.prev = null;
    // }

    siblings.push(element);
    // element.parent = parent || null;
};

DomHandler.prototype.onopentag = function (name, attribs) {
    var properties = {
        type: name === 'script' ? _domelementtype2.default.Script : name === 'style' ? _domelementtype2.default.Style : _domelementtype2.default.Tag,
        name: name,
        attribs: attribs,
        children: []
    };

    var element = this._createDomElement(properties);

    this._addDomElement(element);

    this._tagStack.push(element);
};

DomHandler.prototype.ontext = function (data) {
    //the ignoreWhitespace is officially dropped, but for now,
    //it's an alias for normalizeWhitespace
    var normalize = this._options.normalizeWhitespace || this._options.ignoreWhitespace;

    var lastTag = void 0;

    if (!this._tagStack.length && this.dom.length && (lastTag = this.dom[this.dom.length - 1]).type === _domelementtype2.default.Text) {
        if (normalize) {
            lastTag.data = (lastTag.data + data).replace(re_whitespace, ' ');
        } else {
            lastTag.data += data;
        }
    } else {
        if (this._tagStack.length && (lastTag = this._tagStack[this._tagStack.length - 1]) && (lastTag = lastTag.children[lastTag.children.length - 1]) && lastTag.type === _domelementtype2.default.Text) {
            if (normalize) {
                lastTag.data = (lastTag.data + data).replace(re_whitespace, ' ');
            } else {
                lastTag.data += data;
            }
        } else {
            if (normalize) {
                data = data.replace(re_whitespace, ' ');
            }

            var element = this._createDomElement({
                data: data,
                type: _domelementtype2.default.Text
            });

            this._addDomElement(element);
        }
    }
};

DomHandler.prototype.oncomment = function (data) {
    var lastTag = this._tagStack[this._tagStack.length - 1];

    if (lastTag && lastTag.type === _domelementtype2.default.Comment) {
        lastTag.data += data;
        return;
    }

    var properties = {
        data: data,
        type: _domelementtype2.default.Comment
    };

    var element = this._createDomElement(properties);

    this._addDomElement(element);
    this._tagStack.push(element);
};

DomHandler.prototype.oncdatastart = function () {
    var properties = {
        children: [{
            data: '',
            type: _domelementtype2.default.Text
        }],
        type: _domelementtype2.default.CDATA
    };

    var element = this._createDomElement(properties);

    this._addDomElement(element);
    this._tagStack.push(element);
};

DomHandler.prototype.oncommentend = DomHandler.prototype.oncdataend = function () {
    this._tagStack.pop();
};

DomHandler.prototype.onprocessinginstruction = function (name, data) {
    var element = this._createDomElement({
        name: name,
        data: data,
        type: _domelementtype2.default.Directive
    });

    this._addDomElement(element);
};
exports.default = DomHandler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zd2FucGFyc2VyL2RvbWhhbmRsZXIvaW5kZXguanMiXSwibmFtZXMiOlsicmVfd2hpdGVzcGFjZSIsIkRvbUhhbmRsZXIiLCJjYWxsYmFjayIsIm9wdGlvbnMiLCJlbGVtZW50Q0IiLCJkZWZhdWx0T3B0cyIsIl9jYWxsYmFjayIsIl9vcHRpb25zIiwiX2VsZW1lbnRDQiIsImRvbSIsIl9kb25lIiwiX3RhZ1N0YWNrIiwiX3BhcnNlciIsIm5vcm1hbGl6ZVdoaXRlc3BhY2UiLCJ3aXRoU3RhcnRJbmRpY2VzIiwid2l0aEVuZEluZGljZXMiLCJwcm90b3R5cGUiLCJvbnBhcnNlcmluaXQiLCJwYXJzZXIiLCJvbnJlc2V0IiwiY2FsbCIsIm9uZW5kIiwiX2hhbmRsZUNhbGxiYWNrIiwib25lcnJvciIsImVycm9yIiwib25jbG9zZXRhZyIsIm5hbWUiLCJpc1NlbGZDbG9zZSIsImVsZW0iLCJwb3AiLCJzZWxmY2xvc2UiLCJlbmRJbmRleCIsIl9jcmVhdGVEb21FbGVtZW50IiwicHJvcGVydGllcyIsIndpdGhEb21MdmwxIiwiZWxlbWVudCIsInR5cGUiLCJPYmplY3QiLCJjcmVhdGUiLCJFbGVtZW50UHJvdG90eXBlIiwiTm9kZVByb3RvdHlwZSIsImtleSIsImhhc093blByb3BlcnR5IiwiX2FkZERvbUVsZW1lbnQiLCJwYXJlbnQiLCJsZW5ndGgiLCJzaWJsaW5ncyIsImNoaWxkcmVuIiwicHJldmlvdXNTaWJsaW5nIiwic3RhcnRJbmRleCIsInB1c2giLCJvbm9wZW50YWciLCJhdHRyaWJzIiwiRWxlbWVudFR5cGUiLCJTY3JpcHQiLCJTdHlsZSIsIlRhZyIsIm9udGV4dCIsImRhdGEiLCJub3JtYWxpemUiLCJpZ25vcmVXaGl0ZXNwYWNlIiwibGFzdFRhZyIsIlRleHQiLCJyZXBsYWNlIiwib25jb21tZW50IiwiQ29tbWVudCIsIm9uY2RhdGFzdGFydCIsIkNEQVRBIiwib25jb21tZW50ZW5kIiwib25jZGF0YWVuZCIsIm9ucHJv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SCxpQkFBTCxDQUF1QkMsVUFBdkIsQ0FBZDs7QUFFQSxTQUFLVSxjQUFMLENBQW9CUixPQUFwQjtBQUNBLFNBQUt4QixTQUFMLENBQWV1QyxJQUFmLENBQW9CZixPQUFwQjtBQUNILENBakJEOztBQW1CQWxDLFdBQVdlLFNBQVgsQ0FBcUJrRCxZQUFyQixHQUFvQyxZQUFZO0FBQzVDLFFBQUlqQyxhQUFhO0FBQ2JjLGtCQUFVLENBQUM7QUFDUFcsa0JBQU0sRUFEQztBQUVQdEIsa0JBQU1pQix5QkFBWVM7QUFGWCxTQUFELENBREc7QUFLYjFCLGNBQU1pQix5QkFBWWM7QUFMTCxLQUFqQjs7QUFRQSxRQUFJaEMsVUFBVSxLQUFLSCxpQkFBTCxDQUF1QkMsVUFBdkIsQ0FBZDs7QUFFQSxTQUFLVSxjQUFMLENBQW9CUixPQUFwQjtBQUNBLFNBQUt4QixTQUFMLENBQWV1QyxJQUFmLENBQW9CZixPQUFwQjtBQUNILENBYkQ7O0FBZUFsQyxXQUFXZSxTQUFYLENBQXFCb0QsWUFBckIsR0FBb0NuRSxXQUFXZSxTQUFYLENBQXFCcUQsVUFBckIsR0FBa0MsWUFBWTtBQUM5RSxTQUFLMUQsU0FBTCxDQUFla0IsR0FBZjtBQUNILENBRkQ7O0FBSUE1QixXQUFXZSxTQUFYLENBQXFCc0QsdUJBQXJCLEdBQStDLFVBQVU1QyxJQUFWLEVBQWdCZ0MsSUFBaEIsRUFBc0I7QUFDakUsUUFBSXZCLFVBQVUsS0FBS0gsaUJBQUwsQ0FBdUI7QUFDakNOLGNBQU1BLElBRDJCO0FBRWpDZ0MsY0FBTUEsSUFGMkI7QUFHakN0QixjQUFNaUIseUJBQVlrQjtBQUhlLEtBQXZCLENBQWQ7O0FBTUEsU0FBSzVCLGNBQUwsQ0FBb0JSLE9BQXBCO0FBQ0gsQ0FSRDtrQkFTZWxDLFUiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuLyoqXG4gKiBAZmlsZSBkb21oYW5kbGVyXG4gKiBAYXV0aG9yIGh0dHBzOi8vZ2l0aHViLmNvbS9mYjU1L2RvbWhhbmRsZXJcbiAqIEBtb2RpZnkgdGFuZ2hhbzAzXG4gKiBAZGF0ZSAyMDE4LzUvMTdcbiAqL1xuXG5pbXBvcnQgRWxlbWVudFR5cGUgZnJvbSAnZG9tZWxlbWVudHR5cGUnO1xuaW1wb3J0IE5vZGVQcm90b3R5cGUgZnJvbSAnLi9saWIvbm9kZS5qcyc7XG5pbXBvcnQgRWxlbWVudFByb3RvdHlwZSBmcm9tICcuL2xpYi9lbGVtZW50LmpzJztcbmNvbnN0IHJlX3doaXRlc3BhY2UgPSAvXFxzKy9nO1xuXG5mdW5jdGlvbiBEb21IYW5kbGVyKGNhbGxiYWNrLCBvcHRpb25zLCBlbGVtZW50Q0IpIHtcbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnb2JqZWN0Jykge1xuICAgICAgICBlbGVtZW50Q0IgPSBvcHRpb25zO1xuICAgICAgICBvcHRpb25zID0gY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrID0gbnVsbDtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGVsZW1lbnRDQiA9IG9wdGlvbnM7XG4gICAgICAgIG9wdGlvbnMgPSBkZWZhdWx0T3B0cztcbiAgICB9XG4gICAgdGhpcy5fY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICB0aGlzLl9vcHRpb25zID0gb3B0aW9ucyB8fCBkZWZhdWx0T3B0cztcbiAgICB0aGlzLl9lbGVtZW50Q0IgPSBlbGVtZW50Q0I7XG4gICAgdGhpcy5kb20gPSBbXTtcbiAgICB0aGlzLl9kb25lID0gZmFsc2U7XG4gICAgdGhpcy5fdGFnU3RhY2sgPSBbXTtcbiAgICB0aGlzLl9wYXJzZXIgPSB0aGlzLl9wYXJzZXIgfHwgbnVsbDtcbn1cblxuLy9kZWZhdWx0IG9wdGlvbnNcbmxldCBkZWZhdWx0T3B0cyA9IHtcbiAgICBub3JtYWxpemVXaGl0ZXNwYWNlOiBmYWxzZSwgLy9SZXBsYWNlIGFsbCB3aGl0ZXNwYWNlIHdpdGggc2luZ2xlIHNwYWNlc1xuICAgIHdpdGhTdGFydEluZGljZXM6IGZhbHNlLCAvL0FkZCBzdGFydEluZGV4IHByb3BlcnRpZXMgdG8gbm9kZXNcbiAgICB3aXRoRW5kSW5kaWNlczogZmFsc2UsIC8vQWRkIGVuZEluZGV4IHByb3BlcnRpZXMgdG8gbm9kZXNcbn07XG5cbkRvbUhhbmRsZXIucHJvdG90eXBlLm9ucGFyc2VyaW5pdCA9IGZ1bmN0aW9uIChwYXJzZXIpIHtcbiAgICB0aGlzLl9wYXJzZXIgPSBwYXJzZXI7XG59O1xuXG4vL1Jlc2V0cyB0aGUgaGFuZGxlciBiYWNrIHRvIHN0YXJ0aW5nIHN0YXRlXG5Eb21IYW5kbGVyLnByb3RvdHlwZS5vbnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIERvbUhhbmRsZXIuY2FsbCh0aGlzLCB0aGlzLl9jYWxsYmFjaywgdGhpcy5fb3B0aW9ucywgdGhpcy5fZWxlbWVudENCKTtcbn07XG5cbi8vU2lnbmFscyB0aGUgaGFuZGxlciB0aGF0IHBhcnNpbmcgaXMgZG9uZVxuRG9tSGFuZGxlci5wcm90b3R5cGUub25lbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX2RvbmUpIHJldHVybjtcbiAgICB0aGlzLl9kb25lID0gdHJ1ZTtcbiAgICB0aGlzLl9wYXJzZXIgPSBudWxsO1xuICAgIHRoaXMuX2hhbmRsZUNhbGxiYWNrKG51bGwpO1xufTtcblxuRG9tSGFuZGxlci5wcm90b3R5cGUuX2hhbmRsZUNhbGxiYWNrID1cbiAgICBEb21IYW5kbGVyLnByb3RvdHlwZS5vbmVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5fY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoaXMuX2NhbGxiYWNrKGVycm9yLCB0aGlzLmRvbSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoZXJyb3IpIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfTtcblxuRG9tSGFuZGxlci5wcm90b3R5cGUub25jbG9zZXRhZyA9IGZ1bmN0aW9uIChuYW1lLCBpc1NlbGZDbG9zZSkge1xuICAgIC8vaWYodGhpcy5fdGFnU3RhY2sucG9wKCkubmFtZSAhPT0gbmFtZSkgdGhpcy5faGFuZGxlQ2FsbGJhY2soRXJyb3IoJ1RhZ25hbWUgZGlkbid0IG1hdGNoIScpKTtcbiAgICBsZXQgZWxlbSA9IHRoaXMuX3RhZ1N0YWNrLnBvcCgpO1xuICAgIGVsZW0uc2VsZmNsb3NlID0gISFpc1NlbGZDbG9zZTtcbiAgICBpZiAodGhpcy5fb3B0aW9ucy53aXRoRW5kSW5kaWNlcyAmJiBlbGVtKSB7XG4gICAgICAgIGVsZW0uZW5kSW5kZXggPSB0aGlzLl9wYXJzZXIuZW5kSW5kZXg7XG4gICAgfVxuICAgIGlmICh0aGlzLl9lbGVtZW50Q0IpIHRoaXMuX2VsZW1lbnRDQihlbGVtKTtcbn07XG5cbkRvbUhhbmRsZXIucHJvdG90eXBlLl9jcmVhdGVEb21FbGVtZW50ID0gZnVuY3Rpb24gKHByb3BlcnRpZXMpIHtcbiAgICBpZiAoIXRoaXMuX29wdGlvbnMud2l0aERvbUx2bDEpIHJldHVybiBwcm9wZXJ0aWVzO1xuXG4gICAgbGV0IGVsZW1lbnQ7XG4gICAgaWYgKHByb3BlcnRpZXMudHlwZSA9PT0gJ3RhZycpIHtcbiAgICAgICAgZWxlbWVudCA9IE9iamVjdC5jcmVhdGUoRWxlbWVudFByb3RvdHlwZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZWxlbWVudCA9IE9iamVjdC5jcmVhdGUoTm9kZVByb3RvdHlwZSk7XG4gICAgfVxuXG4gICAgZm9yIChsZXQga2V5IGluIHByb3BlcnRpZXMpIHtcbiAgICAgICAgaWYgKHByb3BlcnRpZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgZWxlbWVudFtrZXldID0gcHJvcGVydGllc1trZXldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGVsZW1lbnQ7XG59O1xuXG5Eb21IYW5kbGVyLnByb3RvdHlwZS5fYWRkRG9tRWxlbWVudCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgbGV0IHBhcmVudCA9IHRoaXMuX3RhZ1N0YWNrW3RoaXMuX3RhZ1N0YWNrLmxlbmd0aCAtIDFdO1xuICAgIGxldCBzaWJsaW5ncyA9IHBhcmVudCA/IHBhcmVudC5jaGlsZHJlbiA6IHRoaXMuZG9tO1xuICAgIGxldCBwcmV2aW91c1NpYmxpbmcgPSBzaWJsaW5nc1tzaWJsaW5ncy5sZW5ndGggLSAxXTtcblxuICAgIC8vIGVsZW1lbnQubmV4dCA9IG51bGw7XG5cbiAgICBpZiAodGhpcy5fb3B0aW9ucy53aXRoU3RhcnRJbmRpY2VzKSB7XG4gICAgICAgIGVsZW1lbnQuc3RhcnRJbmRleCA9IHRoaXMuX3BhcnNlci5zdGFydEluZGV4O1xuICAgIH1cbiAgICBpZiAodGhpcy5fb3B0aW9ucy53aXRoRW5kSW5kaWNlcykge1xuICAgICAgICBlbGVtZW50LmVuZEluZGV4ID0gdGhpcy5fcGFyc2VyLmVuZEluZGV4O1xuICAgIH1cblxuICAgIC8vIGlmKHByZXZpb3VzU2libGluZyl7XG4gICAgLy8gXHRlbGVtZW50LnByZXYgPSBwcmV2aW91c1NpYmxpbmc7XG4gICAgLy8gXHRwcmV2aW91c1NpYmxpbmcubmV4dCA9IGVsZW1lbnQ7XG4gICAgLy8gfSBlbHNlIHtcbiAgICAvLyBcdGVsZW1lbnQucHJldiA9IG51bGw7XG4gICAgLy8gfVxuXG4gICAgc2libGluZ3MucHVzaChlbGVtZW50KTtcbiAgICAvLyBlbGVtZW50LnBhcmVudCA9IHBhcmVudCB8fCBudWxsO1xufTtcblxuRG9tSGFuZGxlci5wcm90b3R5cGUub25vcGVudGFnID0gZnVuY3Rpb24gKG5hbWUsIGF0dHJpYnMpIHtcbiAgICBsZXQgcHJvcGVydGllcyA9IHtcbiAgICAgICAgdHlwZTogbmFtZSA9PT0gJ3NjcmlwdCcgPyBFbGVtZW50VHlwZS5TY3JpcHQgOiBuYW1lID09PSAnc3R5bGUnID8gRWxlbWVudFR5cGUuU3R5bGUgOiBFbGVtZW50VHlwZS5UYWcsXG4gICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIGF0dHJpYnM6IGF0dHJpYnMsXG4gICAgICAgIGNoaWxkcmVuOiBbXVxuICAgIH07XG5cbiAgICBsZXQgZWxlbWVudCA9IHRoaXMuX2NyZWF0ZURvbUVsZW1lbnQocHJvcGVydGllcyk7XG5cbiAgICB0aGlzLl9hZGREb21FbGVtZW50KGVsZW1lbnQpO1xuXG4gICAgdGhpcy5fdGFnU3RhY2sucHVzaChlbGVtZW50KTtcbn07XG5cbkRvbUhhbmRsZXIucHJvdG90eXBlLm9udGV4dCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgLy90aGUgaWdub3JlV2hpdGVzcGFjZSBpcyBvZmZpY2lhbGx5IGRyb3BwZWQsIGJ1dCBmb3Igbm93LFxuICAgIC8vaXQncyBhbiBhbGlhcyBmb3Igbm9ybWFsaXplV2hpdGVzcGFjZVxuICAgIGxldCBub3JtYWxpemUgPSB0aGlzLl9vcHRpb25zLm5vcm1hbGl6ZVdoaXRlc3BhY2UgfHwgdGhpcy5fb3B0aW9ucy5pZ25vcmVXaGl0ZXNwYWNlO1xuXG4gICAgbGV0IGxhc3RUYWc7XG5cbiAgICBpZiAoIXRoaXMuX3RhZ1N0YWNrLmxlbmd0aCAmJiB0aGlzLmRvbS5sZW5ndGggJiYgKGxhc3RUYWcgPSB0aGlzLmRvbVt0aGlzLmRvbS5sZW5ndGggLSAxXSkudHlwZSA9PT0gRWxlbWVudFR5cGUuVGV4dCkge1xuICAgICAgICBpZiAobm9ybWFsaXplKSB7XG4gICAgICAgICAgICBsYXN0VGFnLmRhdGEgPSAobGFzdFRhZy5kYXRhICsgZGF0YSkucmVwbGFjZShyZV93aGl0ZXNwYWNlLCAnICcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGFzdFRhZy5kYXRhICs9IGRhdGE7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLl90YWdTdGFjay5sZW5ndGggJiZcbiAgICAgICAgICAgIChsYXN0VGFnID0gdGhpcy5fdGFnU3RhY2tbdGhpcy5fdGFnU3RhY2subGVuZ3RoIC0gMV0pICYmXG4gICAgICAgICAgICAobGFzdFRhZyA9IGxhc3RUYWcuY2hpbGRyZW5bbGFzdFRhZy5jaGlsZHJlbi5sZW5ndGggLSAxXSkgJiZcbiAgICAgICAgICAgIGxhc3RUYWcudHlwZSA9PT0gRWxlbWVudFR5cGUuVGV4dFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmIChub3JtYWxpemUpIHtcbiAgICAgICAgICAgICAgICBsYXN0VGFnLmRhdGEgPSAobGFzdFRhZy5kYXRhICsgZGF0YSkucmVwbGFjZShyZV93aGl0ZXNwYWNlLCAnICcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsYXN0VGFnLmRhdGEgKz0gZGF0YTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChub3JtYWxpemUpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gZGF0YS5yZXBsYWNlKHJlX3doaXRlc3BhY2UsICcgJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBlbGVtZW50ID0gdGhpcy5fY3JlYXRlRG9tRWxlbWVudCh7XG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgICAgICB0eXBlOiBFbGVtZW50VHlwZS5UZXh0XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy5fYWRkRG9tRWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkRvbUhhbmRsZXIucHJvdG90eXBlLm9uY29tbWVudCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgbGV0IGxhc3RUYWcgPSB0aGlzLl90YWdTdGFja1t0aGlzLl90YWdTdGFjay5sZW5ndGggLSAxXTtcblxuICAgIGlmIChsYXN0VGFnICYmIGxhc3RUYWcudHlwZSA9PT0gRWxlbWVudFR5cGUuQ29tbWVudCkge1xuICAgICAgICBsYXN0VGFnLmRhdGEgKz0gZGF0YTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBwcm9wZXJ0aWVzID0ge1xuICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICB0eXBlOiBFbGVtZW50VHlwZS5Db21tZW50XG4gICAgfTtcblxuICAgIGxldCBlbGVtZW50ID0gdGhpcy5fY3JlYXRlRG9tRWxlbWVudChwcm9wZXJ0aWVzKTtcblxuICAgIHRoaXMuX2FkZERvbUVsZW1lbnQoZWxlbWVudCk7XG4gICAgdGhpcy5fdGFnU3RhY2sucHVzaChlbGVtZW50KTtcbn07XG5cbkRvbUhhbmRsZXIucHJvdG90eXBlLm9uY2RhdGFzdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgcHJvcGVydGllcyA9IHtcbiAgICAgICAgY2hpbGRyZW46IFt7XG4gICAgICAgICAgICBkYXRhOiAnJyxcbiAgICAgICAgICAgIHR5cGU6IEVsZW1lbnRUeXBlLlRleHRcbiAgICAgICAgfV0sXG4gICAgICAgIHR5cGU6IEVsZW1lbnRUeXBlLkNEQVRBXG4gICAgfTtcblxuICAgIGxldCBlbGVtZW50ID0gdGhpcy5fY3JlYXRlRG9tRWxlbWVudChwcm9wZXJ0aWVzKTtcblxuICAgIHRoaXMuX2FkZERvbUVsZW1lbnQoZWxlbWVudCk7XG4gICAgdGhpcy5fdGFnU3RhY2sucHVzaChlbGVtZW50KTtcbn07XG5cbkRvbUhhbmRsZXIucHJvdG90eXBlLm9uY29tbWVudGVuZCA9IERvbUhhbmRsZXIucHJvdG90eXBlLm9uY2RhdGFlbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fdGFnU3RhY2sucG9wKCk7XG59O1xuXG5Eb21IYW5kbGVyLnByb3RvdHlwZS5vbnByb2Nlc3NpbmdpbnN0cnVjdGlvbiA9IGZ1bmN0aW9uIChuYW1lLCBkYXRhKSB7XG4gICAgbGV0IGVsZW1lbnQgPSB0aGlzLl9jcmVhdGVEb21FbGVtZW50KHtcbiAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgdHlwZTogRWxlbWVudFR5cGUuRGlyZWN0aXZlXG4gICAgfSk7XG5cbiAgICB0aGlzLl9hZGREb21FbGVtZW50KGVsZW1lbnQpO1xufTtcbmV4cG9ydCBkZWZhdWx0IERvbUhhbmRsZXI7Il19