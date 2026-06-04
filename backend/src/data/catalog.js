const ACTION_CATALOG = {
  '9010001': 'User is disabled!',
  '9010002': 'Password expired.',
  '9010003': 'Password expired. User is disabled.',
  '9010004': 'The password must be changed before logon.',
  '9010005': 'Over limit this user connection.',
  '9010006': 'Over limit system concurrent.',
  '9010007': 'Too many users are created.',
  '9010008': 'You cannot access system at this time.',
  '9010009': 'Invalid Username or Password',
  '9010010': 'Password will expire in',
};

function lookupActionDesc(catalogId) {
  return ACTION_CATALOG[String(catalogId)] || String(catalogId);
}

module.exports = { ACTION_CATALOG, lookupActionDesc };
