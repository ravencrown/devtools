'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/* eslint-disable */
/**
 * @file This object will be used as the prototype for Nodes when creating a
 * @author https://github.com/fb55/domhandler
 * @modify tanghao03
 * @date 2018/5/17
 */

var NodePrototype = {
    get firstChild() {
        var children = this.children;
        return children && children[0] || null;
    },
    get lastChild() {
        var children = this.children;
        return children && children[children.length - 1] || null;
    },
    get nodeType() {
        return nodeTypes[this.type] || nodeTypes.element;
    }
};

var domLvl1 = {
    tagName: 'name',
    childNodes: 'children',
    parentNode: 'parent',
    previousSibling: 'prev',
    nextSibling: 'next',
    nodeValue: 'data'
};

var nodeTypes = {
    element: 1,
    text: 3,
    cdata: 4,
    comment: 8
};

Object.keys(domLvl1).forEach(function (key) {
    var shorthand = domLvl1[key];
    Object.defineProperty(NodePrototype, key, {
        get: function get() {
            return this[shorthand] || null;
        },
        set: function set(val) {
            this[shorthand] = val;
            return val;
        }
    });
});
exports.default = NodePrototype;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zd2FucGFyc2VyL2RvbWhhbmRsZXIvbGliL25vZGUuanMiXSwibmFtZXMiOlsiTm9kZVByb3RvdHlwZSIsImZpcnN0Q2hpbGQiLCJjaGlsZHJlbiIsImxhc3RDaGlsZCIsImxlbmd0aCIsIm5vZGVUeXBlIiwibm9kZVR5cGVzIiwidHlwZSIsImVsZW1lbnQiLCJkb21MdmwxIiwidGFnTmFtZSIsImNoaWxkTm9kZXMiLCJwYXJlbnROb2RlIiwicHJldmlvdXNTaWJsaW5nIiwibmV4dFNpYmxpbmciLCJub2RlVmFsdWUiLCJ0ZXh0IiwiY2RhdGEiLCJjb21tZW50IiwiT2JqZWN0Iiwia2V5cyIsImZvckVhY2giLCJrZXkiLCJzaG9ydGhhbmQiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsInNldCIsInZhbCJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQTtBQUNBOzs7Ozs7O0FBT0EsSUFBTUEsZ0JBQWdCO0FBQ2xCLFFBQUlDLFVBQUosR0FBaUI7QUFDYixZQUFJQyxXQUFXLEtBQUtBLFFBQXBCO0FBQ0EsZUFBT0EsWUFBWUEsU0FBUyxDQUFULENBQVosSUFBMkIsSUFBbEM7QUFDSCxLQUppQjtBQUtsQixRQUFJQyxTQUFKLEdBQWdCO0FBQ1osWUFBSUQsV0FBVyxLQUFLQSxRQUFwQjtBQUNBLGVBQU9BLFlBQVlBLFNBQVNBLFNBQVNFLE1BQVQsR0FBa0IsQ0FBM0IsQ0FBWixJQUE2QyxJQUFwRDtBQUNILEtBUmlCO0FBU2xCLFFBQUlDLFFBQUosR0FBZTtBQUNYLGVBQU9DLFVBQVUsS0FBS0MsSUFBZixLQUF3QkQsVUFBVUUsT0FBekM7QUFDSDtBQVhpQixDQUF0Qjs7QUFjQSxJQUFNQyxVQUFVO0FBQ1pDLGFBQVMsTUFERztBQUVaQyxnQkFBWSxVQUZBO0FBR1pDLGdCQUFZLFFBSEE7QUFJWkMscUJBQWlCLE1BSkw7QUFLWkMsaUJBQWEsTUFMRDtBQU1aQyxlQUFXO0FBTkMsQ0FBaEI7O0FBU0EsSUFBTVQsWUFBWTtBQUNkRSxhQUFTLENBREs7QUFFZFEsVUFBTSxDQUZRO0FBR2RDLFdBQU8sQ0FITztBQUlkQyxhQUFTO0FBSkssQ0FBbEI7O0FBT0FDLE9BQU9DLElBQVAsQ0FBWVgsT0FBWixFQUFxQlksT0FBckIsQ0FBNkIsVUFBVUMsR0FBVixFQUFlO0FBQ3hDLFFBQUlDLFlBQVlkLFFBQVFhLEdBQVIsQ0FBaEI7QUFDQUgsV0FBT0ssY0FBUCxDQUFzQnhCLGFBQXRCLEVBQXFDc0IsR0FBckMsRUFBMEM7QUFDdENHLGFBQUssZUFBWTtBQUNiLG1CQUFPLEtBQUtGLFNBQUwsS0FBbUIsSUFBMUI7QUFDSCxTQUhxQztBQUl0Q0csYUFBSyxhQUFVQyxHQUFWLEVBQWU7QUFDaEIsaUJBQUtKLFNBQUwsSUFBa0JJLEdBQWxCO0FBQ0EsbUJBQU9BLEdBQVA7QUFDSDtBQVBxQyxLQUExQztBQVNILENBWEQ7a0JBWWUzQixhIiwiZmlsZSI6Im5vZGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuLyoqXG4gKiBAZmlsZSBUaGlzIG9iamVjdCB3aWxsIGJlIHVzZWQgYXMgdGhlIHByb3RvdHlwZSBmb3IgTm9kZXMgd2hlbiBjcmVhdGluZyBhXG4gKiBAYXV0aG9yIGh0dHBzOi8vZ2l0aHViLmNvbS9mYjU1L2RvbWhhbmRsZXJcbiAqIEBtb2RpZnkgdGFuZ2hhbzAzXG4gKiBAZGF0ZSAyMDE4LzUvMTdcbiAqL1xuXG5jb25zdCBOb2RlUHJvdG90eXBlID0ge1xuICAgIGdldCBmaXJzdENoaWxkKCkge1xuICAgICAgICBsZXQgY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuO1xuICAgICAgICByZXR1cm4gY2hpbGRyZW4gJiYgY2hpbGRyZW5bMF0gfHwgbnVsbDtcbiAgICB9LFxuICAgIGdldCBsYXN0Q2hpbGQoKSB7XG4gICAgICAgIGxldCBjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW47XG4gICAgICAgIHJldHVybiBjaGlsZHJlbiAmJiBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXSB8fCBudWxsO1xuICAgIH0sXG4gICAgZ2V0IG5vZGVUeXBlKCkge1xuICAgICAgICByZXR1cm4gbm9kZVR5cGVzW3RoaXMudHlwZV0gfHwgbm9kZVR5cGVzLmVsZW1lbnQ7XG4gICAgfVxufTtcblxuY29uc3QgZG9tTHZsMSA9IHtcbiAgICB0YWdOYW1lOiAnbmFtZScsXG4gICAgY2hpbGROb2RlczogJ2NoaWxkcmVuJyxcbiAgICBwYXJlbnROb2RlOiAncGFyZW50JyxcbiAgICBwcmV2aW91c1NpYmxpbmc6ICdwcmV2JyxcbiAgICBuZXh0U2libGluZzogJ25leHQnLFxuICAgIG5vZGVWYWx1ZTogJ2RhdGEnXG59O1xuXG5jb25zdCBub2RlVHlwZXMgPSB7XG4gICAgZWxlbWVudDogMSxcbiAgICB0ZXh0OiAzLFxuICAgIGNkYXRhOiA0LFxuICAgIGNvbW1lbnQ6IDhcbn07XG5cbk9iamVjdC5rZXlzKGRvbUx2bDEpLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuICAgIGxldCBzaG9ydGhhbmQgPSBkb21MdmwxW2tleV07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE5vZGVQcm90b3R5cGUsIGtleSwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW3Nob3J0aGFuZF0gfHwgbnVsbDtcbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICB0aGlzW3Nob3J0aGFuZF0gPSB2YWw7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICB9XG4gICAgfSk7XG59KTtcbmV4cG9ydCBkZWZhdWx0IE5vZGVQcm90b3R5cGU7Il19