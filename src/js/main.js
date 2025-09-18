document.addEventListener('DOMContentLoaded', iniciarApp);

// Variables globales
let productosCarrito = [];
let productosArray = [];
let productosFiltrados = [];

function iniciarApp() {
    navbarClasses();
    menuUsuario();
    checkoutToggle();
    activarFiltros();
    cargarProductos();
    miCarrito();
}

document.addEventListener('DOMContentLoaded', () => {
    productosCarrito = JSON.parse(localStorage.getItem('carrito')) || [];
    miCarrito(); 
    actualizarContador();
});

/** 
 * ===============================
 * Funciones para obtener los productos
 * ===============================
*/

// Funcion para cargar los productos desde un archivo JSON
async function cargarProductos() {
    // Iniciamos el try
    try {
        const url = './db.json';
        const respuesta = await fetch(url);
        const resultado = await respuesta.json();
        productosArray = resultado.productos; // Guardamos los productos en la variable global
        mostrarProductos(); // Llamamos a la funcion para mostrar los productos
    } catch (error) {
        console.log(error);
    }
}

// Funcion para mostrar los productos en el HTML
function mostrarProductos() {
    // Limpiamos el contenedor previo 
    limpiarHTML('contenedor-productos');

    // Seleccionamos el contenedor donde se mostraran los productos
    const contenedorProductos = document.getElementById('contenedor-productos');

    // Mostrar productos según filtros 
    const arrayProductos = (productosFiltrados && productosFiltrados.length > 0) ? productosFiltrados : productosArray;
        
    if(contenedorProductos) {
        arrayProductos.forEach(producto =>  {
            // Destruncturing al objeto producto
            const { id, nombre, precio, categoria, descripcion, imagen, cantidad } = producto;
            // Formatear precio 
            const precioFormateado = precio.toLocaleString('es-MX', {
                style: 'currency',
                currency: 'MXN',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            // Creamos un elemento div para cada producto
            const productoCard = document.createElement('DIV');
            productoCard.classList.add('flex', 'flex-col', 'gap-2');
            productoCard.innerHTML = 
            `
            <div class="relative">
                <img src="public/dist/img/${imagen}" alt="${nombre}" class="w-full h-[230px] object-cover mb-2 rounded-2xl">
                <span class="absolute top-3 left-4 text-xs bg-white px-3 py-2 shadow-sm rounded-lg font-bold capitalize">${categoria}</span>
            </div>
            <div class="flex flex-col gap-1 px-2">
                <div class="flex items-center justify-between">
                    <h3 class="text-base font-bold">${nombre}</h3>
                    <p class="text-base font-semibold">${precioFormateado}</p>
                </div>
                <p class="text-xs text-gray-500">${descripcion}</p>
            </div>
            <div class="w-full flex items-center justify-end mt-3 gap-3 px-2">
                <button type="button" class="agregar-carrito px-3 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-950 text-white font-bold text-sm rounded-lg transition-all duration-100 ease-in-out" data-id="${producto.id}">Agregar al carrito</button>
                <button type="button" id="favorito" class="me-gusta p-2 rounded-full border border-gray-200 hover:bg-gray-50 group transition-all duration-100 ease-in-out" aria-label="boton me gusta">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icono size-5 text-gray-300 group-hover:text-gray-800 transition-colors duration-300 ease">
                        <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                    </svg>
                </button>
            </div>
            `;

            // Insertamos el productoCard en el contenedor de productos
            contenedorProductos.appendChild(productoCard);

            // evento al boton me gusta 
            const btnMeGusta = productoCard.querySelector('#favorito');
            const icono = productoCard.querySelector('.icono');

            // Cargar favoritos desde LS o arreglo vacío si no existe
            let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];

            if (favoritos.includes(producto.id)) {
                actualizarEstadoFavorito(btnMeGusta, icono, true);
            }

            btnMeGusta.addEventListener('click', () => {
                const idProducto = producto.id;
                const activo = favoritos.includes(idProducto);

                if (activo) {
                    // Si ya estaba en favoritos → quitarlo
                    favoritos = favoritos.filter(id => id !== idProducto);
                } else {
                    // Si no estaba → agregarlo
                    favoritos.push(idProducto);
                }

                // Guardar en LocalStorage
                localStorage.setItem('favoritos', JSON.stringify(favoritos));

                // Actualizar UI según estado
                actualizarEstadoFavorito(btnMeGusta, icono, !activo);
            });
        });
        
        // Agregamos el evento click a los botones de agregar al carrito
        activarBotonesAgregar();
    }
}

// Funcion para activar los botones de agregar al carrito
function activarBotonesAgregar() {
    // Seleccionamos todos los botones de agregar al carrito
    const btnAgregar = document.querySelectorAll('.agregar-carrito');
    btnAgregar.forEach( btn => {
        // Agregar evento a cada boton
        btn.addEventListener('click', (e) => {
            // Escuchar a que elemento se le dio click
            const id = parseInt(e.target.dataset.id);
            // Buscar el producto en el array de productos
            const producto = productosArray.find( producto => producto.id === id);
            if( producto ) {
                // Verificar si el producto ya esta en el carrito
                const existeProducto = productosCarrito.some(prod => prod.id == producto.id);
                if( existeProducto ) {
                    const index = productosCarrito.findIndex(prod => prod.id === producto.id); // Encontrar el índice del producto
                    productosCarrito[index].cantidad += 1; // Incrementar la cantidad del producto
                } else {
                    // Si no existe, agregar el producto al carrito
                    producto.cantidad = 1; // Inicializar la cantidad del producto
                    productosCarrito = [...productosCarrito, producto]; // Agregar el producto al carrito
                }
                miCarrito(); // Agregar el producto al carrito
                actualizarContador(); // Actualiza el contador del navbar
                mensajeToast('Agregado correctamente', 'El producto se agrego al carrito correctamente'); // Mostrar mensaje
            }
        });
    });
}

// Funcion que agrega un producto al carrito
function miCarrito() {
    // Limpiar el contenido previo del carrito
    limpiarHTML('contenido-panel');

    // Mostrar una alerta cuando el carrito este vacio 
    if (productosCarrito.length <= 0) {
        // Cambiamos el texto del titulo del drawer
        document.getElementById('drawer-titulo').textContent = 'No tienes productos agregados';
        document.getElementById('contenido-pago').classList.add('hidden'); // Limpiar el contenido del contenido pago

        // Crear el elemento de mensaje 
        const contenedor = document.createElement('DIV');
        contenedor.classList.add('text-slate-800', 'font-sans');
        contenedor.innerHTML = 
        `
        <div class="max-w-4xl mx-auto border rounded-lg p-6 bg-gray-50">
            <h3 class="text-lg font-semibold mb-1">Aprovecha nuestra mercancia de lujo que Snkrs tiene para ti</h3>
            <p class="text-sm text-slate-500 mb-6">No te pierdas de la oportunidad de estrenar la mejor mercancia que tenemos para ti.</p>
            <div class="space-y-3 mt-5">
                <!-- Sneakers -->
                <a href="#" class="flex items-center justify-between gap-2 p-4 rounded hover:bg-slate-50 group transition">
                    <div class="flex items-center gap-3">
                        <div class="bg-purple-600 text-white p-2 rounded">
                            <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" width="24" height="24" class="text-white">
                                <defs>
                                    <style>.cls-637a534e15c5759009400731-1{fill:none;stroke:currentColor;stroke-miterlimit:10;}</style>
                                </defs>
                                <path class="cls-637a534e15c5759009400731-1" d="M20.59,15.8H3.41A1.91,1.91,0,0,1,1.5,13.89V6.48A1.18,1.18,0,0,1,2.69,5.3h0a1.22,1.22,0,0,1,1,.55C5.16,8,10.09,7.07,10.09,5.3L19.9,9.82a4.49,4.49,0,0,1,2.6,4.07h0A1.91,1.91,0,0,1,20.59,15.8Z"></path>
                                <path class="cls-637a534e15c5759009400731-1" d="M22.5,13.89V15.8a3.82,3.82,0,0,1-3.82,3.81H3.41A1.9,1.9,0,0,1,1.5,17.7V13.89"></path>
                                <line class="cls-637a534e15c5759009400731-1" x1="9.14" y1="3.39" x2="10.09" y2="5.3"></line>
                                <line class="cls-637a534e15c5759009400731-1" x1="12" y1="10.07" x2="13.91" y2="7.2"></line>
                                <line class="cls-637a534e15c5759009400731-1" x1="14.86" y1="11.98" x2="16.77" y2="9.11"></line>
                            </svg>
                        </div>
                        <div>
                            <p class="font-semibold text-sm">Sneakers</p>
                            <p class="text-sm text-slate-500">Los más vendidos esta temporada.</p>
                        </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 text-slate-400 transition-colors duration-300 group-hover:text-slate-900">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </a>
                </a>
                <!-- Nuevas Colecciones -->
                <a href="#" class="flex items-center justify-between gap-2 p-4 rounded hover:bg-slate-50 group transition">
                    <div class="flex items-center gap-3">
                        <div class="bg-blue-600 text-white p-2 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                        </div>
                        <div>
                            <p class="font-semibold text-sm">Nuevas Colecciones</p>
                            <p class="text-sm text-slate-500">Modelos recién lanzados y exclusivos.</p>
                        </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 text-slate-400 transition-colors duration-300 group-hover:text-slate-900">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </a>
                <!-- Ofertas -->
                <a href="#" class="flex items-center justify-between gap-2 p-4 rounded hover:bg-slate-50 group transition">
                    <div class="flex items-center gap-3">
                        <div class="bg-red-600 text-white p-2 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
                            </svg>
                        </div>
                        <div>
                            <p class="font-semibold text-sm">Ofertas</p>
                            <p class="text-sm text-slate-500">Hasta 50% de descuento por tiempo limitado.</p>
                        </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 text-slate-400 transition-colors duration-300 group-hover:text-slate-900">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </a>
            </div>
        </div>
        `;
        // Agregar el mensaje al contenedor del panel
        document.getElementById('contenido-panel').appendChild(contenedor);
        return;
    }

    // Cambiar el texto del titulo del drawer
    document.getElementById('drawer-titulo').textContent = 'Tus producto(s)'; 
    document.getElementById('contenido-pago').classList.remove('hidden');

    // Renderizar la lista de productos en el carrito
    const listaUl = document.createElement('UL');
    listaUl.id = 'lista-productos';
    listaUl.setAttribute('role', 'list');
    listaUl.classList.add('-my-6', 'divide-y', 'divide-gray-200');
    // Agregar al contenedor padre
    document.getElementById('contenido-panel').appendChild(listaUl);

    // Mostrar los productos del carrito
    productosCarrito.forEach( producto => {
        // Destruncturing al objeto producto
        const { id, nombre, precio, categoria, descripcion, imagen, cantidad } = producto;
        // Formatear precio 
        const precioFormateado = precio.toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        // Creamos el elemento li
        const productoLi = document.createElement('LI');
        productoLi.classList.add('flex', 'py-6');
        productoLi.innerHTML = 
        `
        <div class="size-24 shrink-0 overflow-hidden rounded-md border border-gray-200">
            <img src="/public/dist/img/${imagen}" alt="${nombre}" class="size-full object-cover" />
        </div>
        <div class="ml-4 flex flex-1 flex-col">
            <div>
                <div class="flex justify-between text-base font-medium text-gray-900">
                    <h3>
                        <a href="#">${nombre}</a>
                    </h3>
                    <p class="ml-4">${precioFormateado}</p>
                </div>
                <p class="mt-1 text-sm text-gray-500 w-48 truncate">${descripcion}</p>
            </div>
            <div class="flex flex-1 items-end justify-between text-sm">
                <input type="number" min="1" max="8" value="${cantidad}" data-id="${id}" class="cantidad-input w-12 border border-gray-300 rounded px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-zinc-800"/>
                <div class="flex">
                    <button type="button" id="${id}" class="eliminar-producto font-medium text-red-500 hover:text-red-700">Eliminar</button>
                </div>
            </div>
        </div>
        `;
        // Agregar el producto al ul
        listaUl.appendChild(productoLi);

        // Agregar el evento al cambiar de cantidad
        const cantidadInput = productoLi.querySelector('.cantidad-input');
        cantidadInput.addEventListener('change', actualizarCantidadInput);

        // Agergar el evento al eliminar el producto
        const btnEliminar = productoLi.querySelector('.eliminar-producto');
        btnEliminar.addEventListener('click', eliminarProducto);
    });

    // Sincronizar datos con el local storage
    sincronizarStorage();

    // Funcion para calcular el total del pedido
    calcularCantidadTotalPedido(); 
}

// Funcion para actualizar la cantidad de la UI
function actualizarContador() {
    // Actualizar la cantidad de la UI del navbar
    const contadorUI = document.getElementById('contador-productos');
    const totalContador = productosCarrito.length;
    contadorUI.textContent = totalContador;
}

// Funcion que calcula la cantidad del pedido
function calcularCantidadTotalPedido() {
    // Calcular el total en cantidad de productos
    const cantidadTotal = document.getElementById('cantidad-productos');
    if(cantidadTotal) {
        // acum es el acumulador, empieza en 0 (el segundo argumento que se pasa).
        // item es cada producto del carrito mientras se recorre el arreglo.
        // item.cantidad es la cantidad de ese producto en el carrito. En cada paso se suma esa cantidad al acumulador
        const totalCantidad = productosCarrito.reduce((acum, item) => acum + item.cantidad, 0);
        if(totalCantidad === 1) {
            cantidadTotal.textContent = `${totalCantidad} producto`;
        } else {
            cantidadTotal.textContent = `${totalCantidad} productos`;
        }
    }

    // Calcular el subtotal del precio del carrito incluyendo el precio del producto individual por la cantidad
    const precioSubtotal = document.getElementById('subtotal-precio');   
    if(precioSubtotal) {
        // item.precio * item.cantidad calcula el subtotal de cada producto (precio por cantidad).
        // El acumulador acum suma todos esos subtotales.
        // El resultado es el precio total de todo el carrito.
        const totalPrecio = productosCarrito.reduce((acum, item) => acum + (item.precio * item.cantidad), 0);
        // Formatear totalPrecio como moneda MXN
        precioSubtotal.textContent = totalPrecio.toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Calcular el total del precio del carrito más IVA 16% estandar
    const precioTotal = document.getElementById('total-precio');   
    if(precioSubtotal) {
        // item.precio * item.cantidad calcula el subtotal de cada producto (precio por cantidad).
        // El acumulador acum suma todos esos subtotales.
        // El resultado es el precio total de todo el carrito.
        const IVA = 0.16; // 16%
        const subtotal = productosCarrito.reduce((acum, item) => acum + (item.precio * item.cantidad), 0);
        const ivaCantidad = subtotal * IVA;
        const totalConIVA = subtotal + ivaCantidad;
        // Formatear a pesos mexicanos con 2 decimales
        precioTotal.textContent = totalConIVA.toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

// FUncion para eliminar un producto del carrito
function eliminarProducto(e) {
    // Saber el id del producto que se va a eliminar
    const id = parseInt(e.target.id);
    // Incluimos solo los productos cuyo id no coincida con el id del producto a eliminar
    productosCarrito = productosCarrito.filter( producto => producto.id !== id);
    // Sincronizar datos con el local storage
    sincronizarStorage();
    // Renderizar el carrito nuevamente
    miCarrito();
    actualizarContador(); // Actualiza el contador del navbar
    mensajeToast('Eliminado correctamente', 'El producto se elimino del carrito correctamente'); // Mostrar mensaje
}

// Funcion que actualiza la cantidad del producto por medio del input
function actualizarCantidadInput(e) {
    // Saber la cantidad del producto desde el input
    const cantidad = parseInt(e.target.value);
    // Saber el id del producto el cual se le esta actualizando la cantidad
    const id = parseInt(e.target.dataset.id);
    // Encontrar el producto en el carrito al cual se le esta actualizando la cantidad
    const producto = productosCarrito.find(prod => prod.id === id);
    if (producto) {
        if (cantidad <= 0) {
            // Si la cantidad es 0 o menor, eliminar el producto del carrito
            productosCarrito = productosCarrito.filter(p => p.id !== id);
        } else {
            // Actualizar la cantidad del producto
            producto.cantidad = cantidad;
        }
    }
    miCarrito();
    mensajeToast('Actualizado correctamente', 'Se actualizo la cantidad del producto corectamente'); // Mostrar mensaje
}


/** 
 * ===============================
 * Funciones de utilidad
 * ===============================
*/

// Función para aplicar o quitar clases
function actualizarEstadoFavorito(boton, icono, esFavorito) {
    boton.classList.toggle('bg-white-600', esFavorito);
    boton.classList.toggle('border-white-200', esFavorito);
    boton.classList.toggle('hover:bg-white-700', esFavorito);

    icono.classList.toggle('text-red-600', esFavorito);
    icono.classList.toggle('group-hover:text-red-500', esFavorito);
}

// Funcion para activar filtros 
function activarFiltros() {
    // Seleccionamos la clase de los botones
    const botonesFiltro = document.querySelectorAll('.btn-filtro');
    botonesFiltro.forEach( boton => {
        boton.addEventListener('click', () => {
            // Quitar las clases de todos los botones
            botonesFiltro.forEach(btn => btn.classList.remove('bg-zinc-950', 'text-white', 'font-bold', 'hover:bg-zinc-800'));
            botonesFiltro.forEach(btn => btn.classList.add('hover:bg-gray-50'));
            // Agregar las clases solo al boton seleccionado
            boton.classList.add('bg-zinc-950', 'text-white', 'font-bold', 'hover:bg-zinc-800');
            const filtro = boton.dataset.filtro;
            aplicarFiltro(filtro);
        });
    });
}

// Funcion para filtrar los productos 
function aplicarFiltro(filtro) {
    let filtrados = [...productosArray];

    // Filtramos por la categoria seleccionada
    if(filtro !== 'todos') {
        // Si la categoria es diferente a todos aplicamos filtro seleccionado
        filtrados = filtrados.filter(producto => producto.categoria === filtro);
    } else {
        filtrados = productosArray;
    }

    // Guardamos los productos filtrados en una variable global
    productosFiltrados = filtrados;

    // Renderizamos los productos
    mostrarProductos();
}

// Funcion para agregar los datos del carrito al local storage
function sincronizarStorage() {
    localStorage.setItem('carrito', JSON.stringify(productosCarrito));
}

// Funcion para agregar clases al navbar
function navbarClasses() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if(window.scrollY > 10 ) {
            navbar.classList.add('border-b' ,'border-gray-200');
        } else {
            navbar.classList.remove('border-b' ,'border-gray-200');
        }
    });
}

// Funcion para mostrar/ocultar el menu del perfil de usuario
function menuUsuario() {
    const btn = document.getElementById('userDropdownBtn');
    const menu = document.getElementById('userDropdownMenu');

    // Mostrar/ocultar al hacer clic
    btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
    });

    // Cerrar si haces clic fuera
    document.addEventListener('click', (e) => {
        if (!document.getElementById('dropdownWrapper').contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
}

// Funcion para mostrar el checkout del carrito 
function checkoutToggle() {
    const abrirBtn = document.getElementById("abrir-checkout");
    const cerrarBtn = document.getElementById("cerrar-checkout");
    const drawer = document.getElementById("drawer");
    const backdrop = document.getElementById("backdrop-panel");
    const panel = document.getElementById("panel");
    const btnCerrarCompra = document.getElementById("cerrar-compra");

    function abrirDrawer() {
        // Mostrar todo el contenido de backdrop y panel
        drawer.classList.remove("opacity-0", "w-0");
        drawer.classList.add("opacity-1", "w-full");

        // Mostrar la sombra fluida
        backdrop.classList.remove("opacity-0", "w-0");
        backdrop.classList.add("opacity-1", "w-full");

        // Mostrar el panel del checkout
        panel.classList.remove("translate-x-[450px]");
        panel.classList.add("translate-x-0");

        // Bloquear scroll del body
        document.body.classList.add("overflow-hidden");
    }

    function cerrarDrawer() {
        // Eliminar todo el contenido de backdrop y panel
        drawer.classList.remove("opacity-1");
        drawer.classList.add("opacity-0");
        drawer.classList.remove('w-full');

        // Eliminar la sombra fluida
        backdrop.classList.remove("opacity-1");
        backdrop.classList.add("opacity-0");
        backdrop.classList.remove('w-full');
  
        // Eliminar el panel del checkout
        panel.classList.remove("translate-x-0");
        panel.classList.add("translate-x-[450px]");

        // Agregar clases de w-0 para ocultar el drawer y backdrop
        setTimeout(() => {
            drawer.classList.add('w-0');
            backdrop.classList.add('w-0');
            document.body.classList.remove("overflow-hidden");
        }, 500); // Espera a que la transición de opacidad termine
    }

    // Escuchar eventos de click
    abrirBtn.addEventListener("click", abrirDrawer);
    cerrarBtn.addEventListener("click", cerrarDrawer);
    if(btnCerrarCompra) {
        btnCerrarCompra.addEventListener("click", cerrarDrawer);
    }

    // Solo cerrar si clic en sombra (no en el panel)
    panel.addEventListener("click", function (event) {
        if (event.target === event.currentTarget) {
            cerrarDrawer();
        }
    });
}

// Limpiara el contenido previo de un contenedor HTML
function limpiarHTML(idContenedor) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return; // Si no existe el contenedor, termina la función

    while (contenedor.firstChild) {
        contenedor.removeChild(contenedor.firstChild); // Elimina todos los hijos uno por uno
    }
}

// Funcion de mensaje
function mensajeToast(titulo, mensaje) {
    // Verificar si ya existe un toast visible
    const toastExistente = document.querySelector('.toast-visible');
    
    // Si ya existe un toast, no crear uno nuevo
    if (toastExistente) {
        return; // No se crea un nuevo toast si ya existe uno visible
    }

    // Crear el contenedor del toast
    const toast = document.createElement('div');
    toast.classList.add(
        'fixed', 
        'toast-visible',
        'top-4', 
        'z-50',
        'right-0',
        'mx-2',
        'md:mx-0',
        'md:right-7', 
        'px-5',
        'py-4', 
        'rounded-lg',  
        'opacity-0', 
        'transition-all', 
        'duration-300', 
        'ease-in-out',
        'border',
        'border-gray-200',
        'shadow-md',
        'transform',
        'bg-white',
        'dark:bg-zinc-800',
        'dark:border-zinc-700'

    );

    // Crear el contenido del toast 
    const contenidoToast = document.createElement('DIV');
    contenidoToast.innerHTML = `
        <div class="flex items-start gap-4">
            <div>
                ${titulo === 'Agregado correctamente' || titulo === 'Actualizado correctamente' || titulo === 'Eliminado correctamente' ?
                    `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6 text-emerald-400 rounded-full p-1 border-2 border-emerald-400">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    ` 
                    : 

                    `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-7 text-red-600 rounded-full p-1 border-2 border-red-600">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                    ` 
                }
            </div>

            <div>
                <p class="font-semibold text-base dark:text-zinc-200">${titulo}</p>
                <p class="font-normal text-sm text-zinc-500 dark:text-zinc-400 pt-1">${mensaje}</p>
            </div>
            <button type="button" id="cerrar-toast" class="text-gray-400 rounded-full p-1 hover:text-gray-600 hover:transition-colors duration-300 ease-in-out">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    `;

    // Agregar el contenido al toast
    toast.appendChild(contenidoToast);
    // Agregar el toast al body
    document.body.appendChild(toast);

    // Hacer que el toast aparezca con una animación
    setTimeout(() => {
        toast.classList.remove('opacity-0');
        toast.classList.add('opacity-100');
    }, 10);
    
    // accion para cerrar el toast desde la "x"
    const cerrarToast = document.querySelector('#cerrar-toast');
    cerrarToast.addEventListener('click', () => {
        // Iniciar la animacion de salida 
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0');

        // Esperar que termine la animacion antes de eliminar el elemento
        setTimeout(() => {
            toast.remove();
        }, 300);
    });

    // Si el usuario no lo cierra cerrarlo automaticamente
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.remove('opacity-100');
            toast.classList.add('opacity-0');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
    
}