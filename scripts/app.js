
/* === Simple SPA with LocalStorage === */
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));
const formatPrice = (n) => `₹ ${Number(n||0).toFixed(2)}`;

const Storage = {
  get(k, def){ try{ return JSON.parse(localStorage.getItem(k)) ?? def }catch{ return def }},
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)) },
  del(k){ localStorage.removeItem(k) }
};




const Keys = {
  users: "ecofinds_users",
  session: "ecofinds_session",
  products: "ecofinds_products",
  cart: (uid) => `ecofinds_cart_${uid}`,
  purchases: (uid) => `ecofinds_purchases_${uid}`
};

const Auth = {
  current(){
    const s = Storage.get(Keys.session, null);
    if(!s) return null;
    const users = Storage.get(Keys.users, []);
    return users.find(u => u.id === s.userId) || null;
  },
  login(email, password){
    const users = Storage.get(Keys.users, []);
    const found = users.find(u => u.email === email && u.password === btoa(password));
    if(found){
      Storage.set(Keys.session, { userId: found.id });
      return { ok: true, user: found };
    }
    return { ok: false, msg: "Invalid credentials" };
  },
  signup(email, password, username){
    const users = Storage.get(Keys.users, []);
    if(users.some(u => u.email === email)){
      return { ok: false, msg: "Email already registered" };
    }
    const user = {
      id: "u_" + crypto.randomUUID(),
      email,
      password: btoa(password),
      username: username || email.split("@")[0],
      avatar: "https://api.dicebear.com/8.x/identicon/svg?seed=" + encodeURIComponent(username || email)
    };
    users.push(user);
    Storage.set(Keys.users, users);
    Storage.set(Keys.session, { userId: user.id });
    return { ok: true, user };
  },
  logout(){ Storage.del(Keys.session); },
  save(user){
    const users = Storage.get(Keys.users, []);
    const idx = users.findIndex(u => u.id === user.id);
    if(idx >= 0){ users[idx] = user; Storage.set(Keys.users, users); }
  }
};

const Data = {
  categories: [],
  async loadCategories(){
    const res = await fetch("categories.json");
    Data.categories = await res.json();
  },
  allProducts(){ 
  // const defaultProducts = [
  //   {
  //     id: "d1",
  //     ownerId: "system",
  //     title: "Wireless Headphones",
  //     category: "Electronics",
  //     description: "High quality sound with noise cancellation.",
  //     price: 2999,
  //     image: "https://m.media-amazon.com/images/I/71ogmklCZDL._SX466_.jpg"
  //   },
  //   {
  //     id: "d2",
  //     ownerId: "system",
  //     title: "Smart Watch",
  //     category: "Electronics",
  //     description: "Track your fitness and notifications.",
  //     price: 4499,
  //     image: "https://m.media-amazon.com/images/I/61rmkmqD5VL._SX466_.jpg"
  //   },
  //   {
  //     id: "d3",
  //     ownerId: "system",
  //     title: "Bluetooth Speaker",
  //     category: "Electronics",
  //     description: "Portable and powerful bass.",
  //     price: 1999,
  //     image: "https://m.media-amazon.com/images/I/61kQ3rY82ML._AC_UY327_FMwebp_QL65_.jpg"
  //   }
  // ];

  const defaultProducts = [
  // Electronics
  {
    id: 'd1', ownerId: 'system', title: 'Wireless Headphones',
    category: 'Electronics', description: 'High quality sound with noise cancellation.',
    price: 2999, image: 'https://m.media-amazon.com/images/I/71ogmklCZDL._SX466_.jpg'
  },
  {
    id: 'd2', ownerId: 'system', title: 'Smart Watch',
    category: 'Electronics', description: 'Track your fitness and notifications.',
    price: 4499, image: 'https://m.media-amazon.com/images/I/61rmkmqD5VL._SX466_.jpg'
  },
  {
    id: 'd3', ownerId: 'system', title: 'Bluetooth Speaker',
    category: 'Electronics', description: 'Portable and powerful bass.',
    price: 1999, image: 'https://m.media-amazon.com/images/I/61kQ3rY82ML._AC_UY327_FMwebp_QL65_.jpg'
  },

  // Fashion
  {
    id: 'd4', ownerId: 'system', title: 'Men’s Leather Jacket',
    category: 'Fashion', description: 'Classic biker-style genuine leather jacket.',
    price: 7999, image: 'https://m.media-amazon.com/images/I/61Rkv7WLP0L._AC_UL480_FMwebp_QL65_.jpg'
  },
  {
    id: 'd5', ownerId: 'system', title: 'Floral Summer Dress',
    category: 'Fashion', description: 'Lightweight and airy, perfect for sunny days.',
    price: 2499, image: 'https://m.media-amazon.com/images/I/71m1RicH-AL._AC_UL480_FMwebp_QL65_.jpg'
  },
  {
    id: 'd6', ownerId: 'system', title: 'Sports Shoes',
    category: 'Fashion', description: 'Cushioned running shoes with breathable upper.',
    price: 3499, image: 'https://m.media-amazon.com/images/I/71ESgDF-QnL._AC_UL480_FMwebp_QL65_.jpg'
  },

  // Home & Living
  {
    id: 'd7', ownerId: 'system', title: 'Ceramic Vase Set',
    category: 'Home & Living', description: 'Set of 3 stylish ceramic vases.',
    price: 1299, image: 'https://m.media-amazon.com/images/I/71ulohdLT0L._AC_UL480_FMwebp_QL65_.jpg'
  },
  {
    id: 'd8', ownerId: 'system', title: 'Desk Lamp with Touch Control',
    category: 'Home & Living', description: 'Adjustable LED lamp with touch dimmer.',
    price: 1599, image: 'https://m.media-amazon.com/images/I/51DcV4YJw2L._AC_UL480_FMwebp_QL65_.jpg'
  },
  {
    id: 'd9', ownerId: 'system', title: 'Decorative Cushion Covers',
    category: 'Home & Living', description: 'Set of 4 cotton cushion covers, 18"x18".',
    price: 799, image: 'https://m.media-amazon.com/images/I/71znmLQO9tL._AC_UL480_FMwebp_QL65_.jpg'
  },

  // Books
  {
    id: 'd10', ownerId: 'system', title: 'The Alchemist – Paulo Coelho',
    category: 'Books', description: 'A bestselling novel of self-discovery.',
    price: 399, image: 'https://m.media-amazon.com/images/I/617lxveUjYL._AC_UY327_FMwebp_QL65_.jpg'
  },
  {
    id: 'd11', ownerId: 'system', title: 'Atomic Habits – James Clear',
    category: 'Books', description: 'Build good habits and break bad ones.',
    price: 499, image: 'https://m.media-amazon.com/images/I/81F90H7hnML._AC_UY327_FMwebp_QL65_.jpg'
  },
  {
    id: 'd12', ownerId: 'system', title: 'The Power of Now – Eckhart Tolle',
    category: 'Books', description: 'Guide to spiritual enlightenment.',
    price: 449, image: 'https://m.media-amazon.com/images/I/71I6MaZsCcL._AC_UY327_FMwebp_QL65_.jpg'
  },

  // Sports & Outdoors
  {
    id: 'd13', ownerId: 'system', title: 'Yoga Mat',
    category: 'Sports & Outdoors', description: 'Non-slip, eco-friendly yoga mat.',
    price: 999, image: 'https://m.media-amazon.com/images/I/61XpuAiwzsL._AC_UL480_FMwebp_QL65_.jpg'
  },
  {
    id: 'd14', ownerId: 'system', title: 'Stainless Steel Water Bottle',
    category: 'Sports & Outdoors', description: 'Vacuum insulated, 750ml.',
    price: 699, image: 'https://m.media-amazon.com/images/I/71i--IbCPdL._AC_UL480_FMwebp_QL65_.jpg'
  },
  {
    id: 'd15', ownerId: 'system', title: 'Camping Tent (2-person)',
    category: 'Sports & Outdoors', description: 'Lightweight and waterproof tent.',
    price: 3499, image: 'https://m.media-amazon.com/images/I/81Qi90HHsML._AC_UL480_FMwebp_QL65_.jpg'
  },

  // Toys & Games
  {
    id: 'd16', ownerId: 'system', title: 'Building Blocks Set',
    category: 'Toys & Games', description: '300-piece building block for kids.',
    price: 1599, image: 'https://m.media-amazon.com/images/I/713IrB+HcRL._AC_UL480_FMwebp_QL65_.jpg'
  },
  {
    id: 'd17', ownerId: 'system', title: 'Remote Control Car',
    category: 'Toys & Games', description: 'Off-road RC car, rechargeable.',
    price: 2999, image: 'https://m.media-amazon.com/images/I/717pTcRrigL._AC_UL480_FMwebp_QL65_.jpg'
  },
  {
    id: 'd18', ownerId: 'system', title: 'Puzzle Game Board',
    category: 'Toys & Games', description: '1,000-piece landscape puzzle.',
    price: 699, image: 'https://m.media-amazon.com/images/I/81lDrAS14VL._AC_UL480_FMwebp_QL65_.jpg'
  },

  // Automotive
  {
    id: 'd19', ownerId: 'system', title: 'Car Phone Holder',
    category: 'Automotive', description: '360° rotating dashboard phone mount.',
    price: 499, image: 'https://m.media-amazon.com/images/I/51QjPTTgErL._AC_UY327_FMwebp_QL65_.jpg'
  },
  {
    id: 'd20', ownerId: 'system', title: 'Universal Car Charger',
    category: 'Automotive', description: 'Quick charge USB-C and USB-A port.',
    price: 599, image: 'https://m.media-amazon.com/images/I/71RaZGNnyvL._AC_UY327_FMwebp_QL65_.jpg'
  },
  {
    id: 'd21', ownerId: 'system', title: 'Trunk Organizer',
    category: 'Automotive', description: 'Collapsible and multi-compartment organizer.',
    price: 1499, image: 'https://m.media-amazon.com/images/I/81hof5iL9-L._AC_UL480_FMwebp_QL65_.jpg'
  },

  // Others
  {
    id: 'd22', ownerId: 'system', title: 'Wireless Earbuds',
    category: 'Others', description: 'Compact earbuds with charging case.',
    price: 2499, image: 'https://m.media-amazon.com/images/I/71MYal3qCOL._AC_UY327_FMwebp_QL65_.jpg'
  },
  {
    id: 'd23', ownerId: 'system', title: 'Portable Blender',
    category: 'Others', description: 'USB rechargeable mini blender.',
    price: 1999, image: 'https://m.media-amazon.com/images/I/71FxfwiatQL._AC_UY327_FMwebp_QL65_.jpg'
  },
  {
    id: 'd24', ownerId: 'system', title: 'Mini Projector',
    category: 'Others', description: 'Pocket-sized HD projector with HDMI input.',
    price: 4999, image: 'https://m.media-amazon.com/images/I/61dD-ZZV-nL._AC_UY327_FMwebp_QL65_.jpg'
  },

  // Additional items to exceed 30 products
  {
    id: 'd25', ownerId: 'system', title: 'Solar Power Bank',
    category: 'Electronics', description: 'Emergency solar charger, 10,000 mAh.',
    price: 1899, image: 'https://m.media-amazon.com/images/I/61zsaas+4PL._AC_UY327_FMwebp_QL65_.jpg'
  },
  {
    id: 'd26', ownerId: 'system', title: 'Scarves (Pack of 2)',
    category: 'Fashion', description: 'Silk scarves, 90 × 90 cm.',
    price: 1299, image: 'https://m.media-amazon.com/images/I/81qvLXn6imS._AC_UL480_FMwebp_QL65_.jpg'
  },
  {
    id: 'd27', ownerId: 'system', title: 'Scented Candle Set',
    category: 'Home & Living', description: '3 aromas, soy wax candles.',
    price: 999, image: 'https://m.media-amazon.com/images/I/71jjz-5smgL._AC_UL480_FMwebp_QL65_.jpg'
  },
  {
    id: 'd28', ownerId: 'system', title: 'Thriller Novel',
    category: 'Books', description: 'Gripping mystery thriller.',
    price: 349, image: 'https://m.media-amazon.com/images/I/819Rc0S4ENL._AC_UY327_FMwebp_QL65_.jpg'
  },
  {
    id: 'd29', ownerId: 'system', title: 'Fitness Resistance Band',
    category: 'Sports & Outdoors', description: 'Set of 5 resistance levels.',
    price: 799, image: 'https://m.media-amazon.com/images/I/71RQg5h4DTL._AC_UL480_FMwebp_QL65_.jpg'
  },
  {
    id: 'd30', ownerId: 'system', title: 'Board Game',
    category: 'Toys & Games', description: 'Classic strategy board game.',
    price: 1599, image: 'https://m.media-amazon.com/images/I/81wDJT7QUcL._AC_UL480_FMwebp_QL65_.jpg'
  }, 
  {
  id: "d25",
  ownerId: "system",
  title: "Portable Sewing Kit",
  category: "Other",
  description: "Compact sewing kit with needles, threads, and scissors.",
  price: 299,
  image: "https://m.media-amazon.com/images/I/81MZEiviVlL._AC_UL480_FMwebp_QL65_.jpg"
},
{
  id: "d26",
  ownerId: "system",
  title: "Mini Desk Organizer",
  category: "Other",
  description: "Keep your pens, notes, and accessories neatly arranged.",
  price: 399,
  image: "https://m.media-amazon.com/images/I/71KEqN4Aw2L._AC_UL480_FMwebp_QL65_.jpg"
},
{
  id: "d27",
  ownerId: "system",
  title: "LED Keychain Light",
  category: "Other",
  description: "Small yet powerful LED flashlight keychain.",
  price: 149,
  image: "https://m.media-amazon.com/images/I/81qMQIyqsBL._AC_UL480_FMwebp_QL65_.jpg"
},
{
  id: "d28",
  ownerId: "system",
  title: "Travel Neck Pillow",
  category: "Other",
  description: "Soft memory foam pillow for comfortable travel.",
  price: 799,
  image: "https://m.media-amazon.com/images/I/61ktHYSbSIL._AC_UL480_FMwebp_QL65_.jpg"
},
{
  id: "d29",
  ownerId: "system",
  title: "Reusable Shopping Bag",
  category: "Other",
  description: "Eco-friendly foldable shopping bag, washable and durable.",
  price: 199,
  image: "https://m.media-amazon.com/images/I/71+AgyrTYYL._AC_UL480_FMwebp_QL65_.jpg"
}

];


  // ✅ get user-added products from storage
  const userProducts = Storage.get(Keys.products, []);

  // ✅ return both combined
  return [...defaultProducts, ...userProducts];
},
  saveProducts(list){ Storage.set(Keys.products, list); },
  myProducts(uid){ return Data.allProducts().filter(p => p.ownerId === uid); },
  addProduct(p){
    const list = Data.allProducts();
    p.id = "p_" + crypto.randomUUID();
    list.push(p);
    Data.saveProducts(list);
    return p;
  },
  updateProduct(p){
    const list = Data.allProducts();
    const idx = list.findIndex(x => x.id === p.id);
    if(idx>=0){ list[idx] = p; Data.saveProducts(list); }
  },
  removeProduct(id){
    const list = Data.allProducts().filter(p => p.id !== id);
    Data.saveProducts(list);
  },
  getProduct(id){ return Data.allProducts().find(p => p.id === id) || null; },
  cart(uid){ return Storage.get(Keys.cart(uid), []); },
  setCart(uid, arr){ Storage.set(Keys.cart(uid), arr); },
  purchases(uid){ return Storage.get(Keys.purchases(uid), []); },
  setPurchases(uid, arr){ Storage.set(Keys.purchases(uid), arr); }
};

/* === Router === */
const Router = {
  routes: {},
  mount(el){ Router.root = el; },
  add(name, view){ Router.routes[name] = view; },
  go(name, param){ location.hash = `#/${name}${param?"/"+param:""}`; },
  start(){
    window.addEventListener("hashchange", Router.render);
    Router.render();
  },
  parse(){
    const [, name, param] = location.hash.split("/");
    return { name: name || "auth", param };
  },
  async render(){
    $("#year").textContent = new Date().getFullYear();
    const { name, param } = Router.parse();
    const view = Router.routes[name] || Views.Auth;
    await Data.loadCategories();
    Router.root.innerHTML = await view.render(param);
    if(view.afterRender) view.afterRender(param);
    // Auth button
    const user = Auth.current();
    const btn = $("#authBtn");
    if(user){ btn.textContent = "Logout"; } else { btn.textContent = "Login"; }
  }
};

/* === Views === */
const Views = {};

/* Auth (Login / Signup) */
/* Auth (Login / Signup) */
Views.Auth = {
  mode: "login", // default screen

  async render() {
  const user = Auth.current();
  if (user) {
    Router.go("feed");
    return "<div></div>";
  }

  if (this.mode === "login") {
    return `
      <section class="auth-wrapper">
        <div class="auth-card">
          <div class="auth-avatar">
            <img src="assets/images/5087579.png" alt="avatar" />
          </div>

          <h2>Login</h2>
          <form id="loginForm">
            <input type="text" id="loginEmail" placeholder="Email / Username" required />
            <input type="password" id="loginPass" placeholder="Password" required />
            <button class="btn primary" type="submit">Login</button>
            <p class="small">Don’t have an account? <a href="#" id="goSignup">Sign up</a></p>
          </form>
        </div>
      </section>
    `;
  } else {
    return `
      <section class="auth-wrapper">
        <div class="auth-card">
          <div class="auth-avatar">
            <img src="assets/images/5087579.png" alt="avatar" />
          </div>
          <h2>Sign Up</h2>
          <form id="signupForm">
            <input type="text" id="suUsername" placeholder="Display Name" required />
            <input type="email" id="suEmail" placeholder="Email" required />
            <input type="password" id="suPass" placeholder="Password" required />
            <input type="password" id="suConfirm" placeholder="Confirm Password" required />
            <button class="btn primary" type="submit">Sign Up</button>
            <p class="small">Already have an account? <a href="#" id="goLogin">Login</a></p>
          </form>
        </div>
      </section>
    `;
  }
},

  afterRender() {
  if (this.mode === "login") {
    $("#loginForm").onsubmit = (e) => {
      e.preventDefault();
      const r = Auth.login($("#loginEmail").value.trim(), $("#loginPass").value);
      if (r.ok) {
        Router.go("feed");
      } else {
        alert(r.msg);
      }
    };
    $("#goSignup").onclick = (e) => {
      e.preventDefault();
      this.mode = "signup";
      Router.render();
    };
  } else {
    $("#signupForm").onsubmit = (e) => {
      e.preventDefault();
      const pass = $("#suPass").value;
      const confirm = $("#suConfirm").value;
      if (pass !== confirm) {
        alert("Passwords do not match");
        return;
      }
      const r = Auth.signup($("#suEmail").value.trim(), pass, $("#suUsername").value.trim());
      if (r.ok) {
        Router.go("feed");
      } else {
        alert(r.msg);
      }
    };
    $("#goLogin").onclick = (e) => {
      e.preventDefault();
      this.mode = "login";
      Router.render();
    };
  }
},

  toggle(){
    const user = Auth.current();
    if(user){ Auth.logout(); Router.go("auth"); } else { Router.go("auth"); }
  }
};


/* Feed */
Views.Feed = {
  query: "",
  async render(){
    const user = Auth.current();
    if(!user){ Router.go("auth"); return ""; }
    const list = Data.allProducts();
    const filtered = list.filter(p => (!Views.Feed.query || p.title.toLowerCase().includes(Views.Feed.query.toLowerCase())));
    const options = Data.categories.map(c => `<option value="${c}">${c}</option>`).join("");
    return `
      <section>
        <div class="flex">
          <label>Category</label>
          <select id="catFilter">
            <option value="">All</option>
            ${options}
          </select>
          <button class="btn ghost" onclick="Router.go('add')">+ Add Product</button>
        </div>
        <div class="grid" id="feedGrid">
          ${filtered.map(Views.card).join("") || "<p>No products yet. Add something!</p>"}
        </div>
      </section>
    `;
  },
  afterRender(){
    $("#catFilter").onchange = (e)=>{
      const val = e.target.value;
      const list = Data.allProducts().filter(p => (!val || p.category === val) && (!Views.Feed.query || p.title.toLowerCase().includes(Views.Feed.query.toLowerCase())));
      $("#feedGrid").innerHTML = list.map(Views.card).join("");
    };
  },
  updateQuery(q){
    Views.Feed.query = q;
    Router.render();
  }
};

/* Card template */
Views.card = (p) => `
  <article class="card">
    <a class="img" href="#/detail/${p.id}">
      <img src="${p.image || 'assets/images/placeholder.svg'}" alt="${p.title}" />
    </a>
    <div class="body">
      <div class="flex">
        <strong>${p.title}</strong>
        <span class="badge">${p.category}</span>
      </div>
      <div class="price">${formatPrice(p.price)}</div>
      <div class="actions">
        <a class="btn ghost" href="#/detail/${p.id}">View</a>
        ${Auth.current()?.id === p.ownerId ? `<a class="btn" href="#/edit/${p.id}">Edit</a>` : ""}
      </div>
    </div>
  </article>
`;

/* Add New Product */
Views.Add = {
  async render(){
    const user = Auth.current();
    if(!user){ Router.go("auth"); return ""; }
    const options = Data.categories.map(c => `<option value="${c}">${c}</option>`).join("");
    return `
      <section class="center">
        <h2>Add New Product</h2>
        <form id="addForm">
          <input required id="pTitle" placeholder="Product Title" />
          <select required id="pCat">
            <option value="">Select Category</option>
            ${options}
          </select>
          <textarea id="pDesc" placeholder="Description"></textarea>
          <input required id="pPrice" type="number" min="0" step="0.01" placeholder="Price" />
          <input id="pImg" placeholder="Image URL (optional)" />
          <div class="actions">
            <button class="btn primary" type="submit">Submit Listing</button>
            <a class="btn ghost" href="#/feed">Cancel</a>
          </div>
        </form>
      </section>
    `;
  },
  afterRender(){
    $("#addForm").onsubmit = (e)=>{
      e.preventDefault();
      const user = Auth.current();
      const p = {
        ownerId: user.id,
        title: $("#pTitle").value.trim(),
        category: $("#pCat").value,
        description: $("#pDesc").value.trim(),
        price: parseFloat($("#pPrice").value || "0"),
        image: $("#pImg").value.trim() || "assets/images/placeholder.svg"
      };
      Data.addProduct(p);
      Router.go("my-listings");
    };
  }
};

/* Edit Product */
Views.Edit = {
  async render(id){
    const user = Auth.current();
    if(!user){ Router.go("auth"); return ""; }
    const p = Data.getProduct(id);
    if(!p){ return "<p>Not found</p>"; }
    if(p.ownerId !== user.id){ Router.go("feed"); return ""; }
    const options = Data.categories.map(c => `<option ${p.category===c?"selected":""} value='${c}'>${c}</option>`).join("");
    return `
      <section class="center">
        <h2>Edit Product</h2>
        <form id="editForm">
          <input required id="pTitle" value="${p.title}" />
          <select required id="pCat">${options}</select>
          <textarea id="pDesc">${p.description||""}</textarea>
          <input required id="pPrice" type="number" min="0" step="0.01" value="${p.price}" />
          <input id="pImg" value="${p.image||""}" />
          <div class="actions">
            <button class="btn primary" type="submit">Save</button>
            <button class="btn danger" id="delBtn" type="button">Delete</button>
            <a class="btn ghost" href="#/my-listings">Back</a>
          </div>
        </form>
      </section>
    `;
  },
  afterRender(){
    const id = Router.parse().param;
    const p = Data.getProduct(id);
    $("#editForm").onsubmit = (e)=>{
      e.preventDefault();
      p.title = $("#pTitle").value.trim();
      p.category = $("#pCat").value;
      p.description = $("#pDesc").value.trim();
      p.price = parseFloat($("#pPrice").value || "0");
      p.image = $("#pImg").value.trim() || "assets/images/placeholder.svg";
      Data.updateProduct(p);
      Router.go("my-listings");
    };
    $("#delBtn").onclick = ()=>{
      if(confirm("Delete this listing?")){
        Data.removeProduct(id);
        Router.go("my-listings");
      }
    }
  }
};

/* My Listings */
Views.MyListings = {
  async render(){
    const user = Auth.current();
    if(!user){ Router.go("auth"); return ""; }
    const list = Data.myProducts(user.id);
    return `
      <section>
        <div class="flex">
          <h2>My Listings</h2>
          <a class="btn ghost" href="#/add">+ Add Product</a>
        </div>
        <div class="grid">
          ${list.map(Views.card).join("") || "<p>You have no listings yet.</p>"}
        </div>
      </section>
    `;
  }
};

/* Product Detail */
Views.Detail = {
  async render(id){
    const user = Auth.current();
    if(!user){ Router.go("auth"); return ""; }
    const p = Data.getProduct(id);
    if(!p) return "<p>Not found</p>";
    const mine = user.id === p.ownerId;
    return `
      <section class="center">
        <a class="btn ghost" href="#/feed">← Back</a><br/><br/>
        <article class="card">
          <div class="img"><img src="${p.image||'assets/images/placeholder.svg'}" alt="${p.title}"/></div>
          <div class="body">
            <h2>${p.title}</h2>
            <div class="flex">
              <span class="badge">${p.category}</span>
              <strong class="price">${formatPrice(p.price)}</strong>
            </div>
            <p>${p.description || ""}</p>
            <div class="actions">
              ${mine ? `<a class="btn" href="#/edit/${p.id}">Edit</a>` : `<button class="btn primary" id="addCart">Add to Cart</button>
              <button class="btn ghost" id="buyNow">Buy Now</button>`}
            </div>
          </div>
        </article>
      </section>
    `;
  },
  afterRender(id){
    const user = Auth.current();
    const p = Data.getProduct(id);
    const add = $("#addCart");
    const buy = $("#buyNow");
    if(add){
      add.onclick = ()=>{
        const cart = Data.cart(user.id);
        if(!cart.includes(p.id)){ cart.push(p.id); Data.setCart(user.id, cart); }
        alert("Added to cart");
      };
    }
    if(buy){
      buy.onclick = ()=>{
        const purchases = Data.purchases(user.id);
        purchases.push(p.id);
        Data.setPurchases(user.id, purchases);
        alert("Purchased!");
        Router.go("purchases");
      };
    }
  }
};

/* Cart */
Views.Cart = {
  async render(){
    const user = Auth.current();
    if(!user){ Router.go("auth"); return ""; }
    const ids = Data.cart(user.id);
    const items = ids.map(id => Data.getProduct(id)).filter(Boolean);
    return `
      <section>
        <h2>Cart</h2>
        <div class="grid">
          ${items.map(p => `
            <article class="card">
              <a class="img" href="#/detail/${p.id}"><img src="${p.image||'assets/images/placeholder.svg'}" alt="${p.title}"></a>
              <div class="body">
                <strong>${p.title}</strong>
                <div class="price">${formatPrice(p.price)}</div>
                <div class="actions">
                  <button class="btn danger" data-id="${p.id}" data-action="remove">Remove</button>
                </div>
              </div>
            </article>
          `).join("") || "<p>Your cart is empty.</p>"}
        </div>
        <hr/>
        <div class="actions">
          <button id="checkoutBtn" class="btn primary">Checkout</button>
          <a class="btn ghost" href="#/feed">Continue Shopping</a>
        </div>
      </section>
    `;
  },
  afterRender(){
    const user = Auth.current();
    $$("#app [data-action='remove']").forEach(btn=>{
      btn.onclick = ()=>{
        const id = btn.getAttribute("data-id");
        const cart = Data.cart(user.id).filter(x => x !== id);
        Data.setCart(user.id, cart);
        Router.render();
      };
    });
    $("#checkoutBtn").onclick = ()=>{
      const cart = Data.cart(user.id);
      const purchases = Data.purchases(user.id);
      Data.setPurchases(user.id, purchases.concat(cart));
      Data.setCart(user.id, []);
      alert("Checkout complete!");
      Router.go("purchases");
    };
  }
};

/* Purchases */
Views.Purchases = {
  async render(){
    const user = Auth.current();
    if(!user){ Router.go("auth"); return ""; }
    const ids = Data.purchases(user.id);
    const items = ids.map(id => Data.getProduct(id)).filter(Boolean);
    return `
      <section>
        <h2>Previous Purchases</h2>
        <div class="grid">
          ${items.map(Views.card).join("") || "<p>No purchases yet.</p>"}
        </div>
      </section>
    `;
  }
};

/* Dashboard */
Views.Dashboard = {
  async render(){
    const user = Auth.current();
    if(!user){ Router.go("auth"); return ""; }
    return `
      <section class="center">
        <h2>User Dashboard</h2>
        <form id="profileForm">
          <label>Email</label>
          <input id="pfEmail" type="email" value="${user.email}" required />
          <label>Username</label>
          <input id="pfUsername" value="${user.username || ""}" />
          <label>Avatar URL</label>
          <input id="pfAvatar" value="${user.avatar || ""}" />
          <div class="actions">
            <button class="btn primary" type="submit">Save Changes</button>
            <a class="btn ghost" href="#/feed">Back</a>
          </div>
        </form>
      </section>
    `;
  },
  afterRender(){
    $("#profileForm").onsubmit = (e)=>{
      e.preventDefault();
      const user = Auth.current();
      user.email = $("#pfEmail").value.trim();
      user.username = $("#pfUsername").value.trim();
      user.avatar = $("#pfAvatar").value.trim();
      Auth.save(user);
      alert("Profile updated");
    };
  }
};

/* Register routes */
Router.add("auth", Views.Auth);
Router.add("feed", Views.Feed);
Router.add("add", Views.Add);
Router.add("edit", Views.Edit);
Router.add("my-listings", Views.MyListings);
Router.add("detail", Views.Detail);
Router.add("cart", Views.Cart);
Router.add("purchases", Views.Purchases);
Router.add("dashboard", Views.Dashboard);

/* Boot */
Router.mount($("#app"));
Router.start();
