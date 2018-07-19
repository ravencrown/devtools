'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _node = require('./node.js');

var _node2 = _interopRequireDefault(_node);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ElementPrototype = Object.create(_node2.default); /* eslint-disable */
/**
 * @file DOM-Level-1-compliant structure
 * @author https://github.com/fb55/domhandler
 * @modify tanghao03
 * @date 2018/5/17
 */

exports.default = Object.create(_node2.default);

var domLvl1 = {
    tagName: 'name'
};

Object.keys(domLvl1).forEach(function (key) {
    var shorthand = domLvl1[key];
    Object.defineProperty(ElementPrototype, key, {
        get: function get() {
            return this[shorthand] || null;
        },
        set: function set(val) {
            this[shorthand] = val;
            return val;
        }
    });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zd2FucGFyc2VyL2RvbWhhbmRsZXIvbGliL2VsZW1lbnQuanMiXSwibmFtZXMiOlsiRWxlbWVudFByb3RvdHlwZSIsIk9iamVjdCIsImNyZWF0ZSIsIk5vZGVQcm90b3R5cGUiLCJkb21MdmwxIiwidGFnTmFtZSIsImtleXMiLCJmb3JFYWNoIiwia2V5Iiwic2hvcnRoYW5kIiwiZGVmaW5lUHJvcGVydHkiLCJnZXQiLCJzZXQiLCJ2YWwiXSwibWFwcGluZ3MiOiI7Ozs7OztBQVFBOzs7Ozs7QUFDQSxJQUFNQSxtQkFBbUJDLE9BQU9DLE1BQVAsQ0FBY0MsY0FBZCxDQUF6QixDLENBVEE7QUFDQTs7Ozs7OztrQkFTZUYsT0FBT0MsTUFBUCxDQUFjQyxjQUFkLEM7O0FBQ2YsSUFBTUMsVUFBVTtBQUNaQyxhQUFTO0FBREcsQ0FBaEI7O0FBSUFKLE9BQU9LLElBQVAsQ0FBWUYsT0FBWixFQUFxQkcsT0FBckIsQ0FBNkIsVUFBVUMsR0FBVixFQUFlO0FBQ3hDLFFBQUlDLFlBQVlMLFFBQVFJLEdBQVIsQ0FBaEI7QUFDQVAsV0FBT1MsY0FBUCxDQUFzQlYsZ0JBQXRCLEVBQXdDUSxHQUF4QyxFQUE2QztBQUN6Q0csYUFBSyxlQUFZO0FBQ2IsbUJBQU8sS0FBS0YsU0FBTCxLQUFtQixJQUExQjtBQUNILFNBSHdDO0FBSXpDRyxhQUFLLGFBQVVDLEdBQVYsRUFBZTtBQUNoQixpQkFBS0osU0FBTCxJQUFrQkksR0FBbEI7QUFDQSxtQkFBT0EsR0FBUDtBQUNIO0FBUHdDLEtBQTdDO0FBU0gsQ0FYRCIsImZpbGUiOiJlbGVtZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbi8qKlxuICogQGZpbGUgRE9NLUxldmVsLTEtY29tcGxpYW50IHN0cnVjdHVyZVxuICogQGF1dGhvciBodHRwczovL2dpdGh1Yi5jb20vZmI1NS9kb21oYW5kbGVyXG4gKiBAbW9kaWZ5IHRhbmdoYW8wM1xuICogQGRhdGUgMjAxOC81LzE3XG4gKi9cblxuaW1wb3J0IE5vZGVQcm90b3R5cGUgZnJvbSAnLi9ub2RlLmpzJztcbmNvbnN0IEVsZW1lbnRQcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE5vZGVQcm90b3R5cGUpO1xuZXhwb3J0IGRlZmF1bHQgT2JqZWN0LmNyZWF0ZShOb2RlUHJvdG90eXBlKTtcbmNvbnN0IGRvbUx2bDEgPSB7XG4gICAgdGFnTmFtZTogJ25hbWUnXG59O1xuXG5PYmplY3Qua2V5cyhkb21MdmwxKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICBsZXQgc2hvcnRoYW5kID0gZG9tTHZsMVtrZXldO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFbGVtZW50UHJvdG90eXBlLCBrZXksIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1tzaG9ydGhhbmRdIHx8IG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICAgICAgdGhpc1tzaG9ydGhhbmRdID0gdmFsO1xuICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG4iXX0=