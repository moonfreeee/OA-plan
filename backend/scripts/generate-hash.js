const bcrypt = require('bcryptjs');
const passwords = ['Admin@123', 'Member@123', 'Pending@123'];
passwords.forEach((p) => {
  console.log(p, bcrypt.hashSync(p, 10));
});
