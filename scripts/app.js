
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
  allProducts(){ return Storage.get(Keys.products, []); },
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
