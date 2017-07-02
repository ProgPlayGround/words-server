
module.exports = {
  searchFilter: function searchCriteria(user, category) {
    var filter = {'user': user};
    if(category !== 'All Categories') {
      filter.category = category;
    }
    return filter;
  }
}
