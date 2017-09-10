var total = require('../config').maxActivities;
var lastActivity = total - 1;

module.exports = function(initial, activity) {
  var activities = initial || [];

  activities.unshift(activity);
  if(activities.length > total) {
    data.activities.splice(lastActivity);
  }
  return activities;
};
