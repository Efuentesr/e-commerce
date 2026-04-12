"""
Comando de gestión para poblar la base de datos con datos de prueba.
Genera categorías, 112 productos con imágenes Pillow, usuario admin y usuarios de prueba.
Idempotente: no genera duplicados si ya existen los datos.
"""
import io
import re
import unicodedata
import random
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.contrib.auth import get_user_model
from apps.products.models import Category, Product, ProductImage
from simple_history.utils import update_change_reason

User = get_user_model()

# ─── Paleta de colores por categoría ───
COLORES = {
    'electronica':      [(37, 99, 235), (29, 78, 216), (30, 58, 138)],
    'ropa-y-moda':      [(168, 85, 247), (139, 92, 246), (109, 40, 217)],
    'hogar-y-jardin':   [(5, 150, 105), (4, 120, 87), (6, 95, 70)],
    'deportes':         [(220, 38, 38), (185, 28, 28), (153, 27, 27)],
    'libros':           [(217, 119, 6), (180, 83, 9), (146, 64, 14)],
    'juguetes':         [(236, 72, 153), (219, 39, 119), (190, 24, 93)],
    'belleza':          [(14, 165, 233), (2, 132, 199), (3, 105, 161)],
    'alimentos':        [(101, 163, 13), (77, 124, 15), (63, 98, 18)],
    'herramientas':     [(100, 116, 139), (71, 85, 105), (51, 65, 85)],
    'automotriz':       [(234, 88, 12), (194, 65, 12), (154, 52, 18)],
}

# ─── Datos de categorías y productos ───
CATALOGO = [
    {
        'name': 'Electrónica', 'slug': 'electronica',
        'products': [
            ('SM-A545', 'Smartphone Samsung Galaxy A54', 299.99, 50, 'Smartphone con pantalla Super AMOLED de 6.4", cámara de 50MP y batería de 5000mAh. Ideal para trabajo y entretenimiento.'),
            ('IPH-15P', 'iPhone 15 Pro', 999.99, 30, 'El iPhone más avanzado con chip A17 Pro, cámara de 48MP con zoom 5x y titanio de grado aeroespacial.'),
            ('LPT-HP15', 'Laptop HP Pavilion 15', 599.99, 40, 'Laptop con procesador Intel Core i5 de 13ª gen, 16GB RAM, SSD 512GB y pantalla FHD de 15.6".'),
            ('MAC-AIR', 'MacBook Air M2', 1199.99, 25, 'El portátil más silencioso jamás fabricado. Chip M2, pantalla Liquid Retina de 13.6" y hasta 18 horas de batería.'),
            ('TAB-S9', 'Tablet Samsung Galaxy Tab S9', 449.99, 35, 'Tablet premium con pantalla Dynamic AMOLED 2X de 11", procesador Snapdragon 8 Gen 2 y soporte S Pen.'),
            ('APL-PAD', 'iPad Air 5ta Gen', 749.99, 28, 'iPad Air con chip M1, pantalla Liquid Retina de 10.9" y soporte para Apple Pencil 2ª generación.'),
            ('AUD-SNY', 'Auriculares Sony WH-1000XM5', 299.99, 60, 'Auriculares inalámbricos con la mejor cancelación de ruido de la industria y 30 horas de batería.'),
            ('APL-POD', 'AirPods Pro 2da Gen', 249.99, 55, 'AirPods con cancelación activa de ruido adaptable, audio espacial personalizado y estuche MagSafe.'),
            ('TV-LG55', 'Smart TV LG 55" 4K OLED', 1299.99, 20, 'TV OLED con procesador α9 Gen6 AI, Dolby Vision y Dolby Atmos. Imagen perfecta y negros absolutos.'),
            ('MON-DEL', 'Monitor Dell 27" QHD', 349.99, 45, 'Monitor IPS de 27" con resolución 2560x1440, 165Hz y tiempo de respuesta de 1ms. Ideal para gaming y trabajo.'),
            ('WAT-APL', 'Apple Watch Series 9', 399.99, 40, 'Smartwatch con pantalla siempre activa, chip S9, detección de accidentes y medición de temperatura corporal.'),
            ('CAM-CNO', 'Cámara Canon EOS M50 Mark II', 549.99, 22, 'Cámara mirrorless con sensor de 24.1MP, vídeo 4K y pantalla táctil giratoria. Perfecta para creadores de contenido.'),
        ],
    },
    {
        'name': 'Ropa y Moda', 'slug': 'ropa-y-moda',
        'products': [
            ('CAM-CAS', 'Camisa Casual Oxford Hombre', 39.99, 120, 'Camisa de algodón 100% con corte slim fit. Disponible en varios colores. Perfecta para look casual o smart casual.'),
            ('VES-FLO', 'Vestido Floral Verano Mujer', 59.99, 80, 'Vestido midi con estampado floral, escote V y falda voluminosa. Telas frescas para el verano.'),
            ('JNS-SKN', 'Jeans Skinny Premium', 79.99, 90, 'Jeans con lycra para máximo confort y ajuste perfecto. Cintura alta y tiro medio. Lavado oscuro.'),
            ('ZAP-NKE', 'Zapatillas Nike Air Max 270', 129.99, 70, 'Zapatillas deportivas con cámara Air Max visible, espuma React y diseño moderno para uso diario.'),
            ('ZAP-OXF', 'Zapatos Oxford Cuero Genuino', 119.99, 50, 'Zapatos de cuero genuino con suela de goma antideslizante. Elegantes y cómodos para ocasiones formales.'),
            ('CHA-CUE', 'Chaqueta de Cuero Premium', 199.99, 35, 'Chaqueta de cuero genuino con forro interior polar, cierre YKK y múltiples bolsillos. Clásica y duradera.'),
            ('ABR-INV', 'Abrigo Largo de Lana', 249.99, 30, 'Abrigo de lana merina con forro de seda, botones de nácar y corte oversize. Elegancia y calor invernal.'),
            ('TRJ-FOR', 'Traje Formal 2 Piezas', 349.99, 25, 'Traje de lana y poliéster con saco y pantalón. Corte moderno slim fit, perfecto para reuniones de negocios.'),
            ('BOL-CUE', 'Bolso Tote de Cuero', 99.99, 45, 'Bolso tote espacioso de cuero PU con cierre magnético, bolsillo interior y correa ajustable.'),
            ('CIN-CUE', 'Cinturón de Cuero Trenzado', 29.99, 100, 'Cinturón de cuero genuino con hebilla metálica dorada. Largo ajustable, ideal para jeans o pantalones formales.'),
        ],
    },
    {
        'name': 'Hogar y Jardín', 'slug': 'hogar-y-jardin',
        'products': [
            ('SOF-3PL', 'Sofá 3 Plazas Tela Premium', 799.99, 15, 'Sofá tapizado en tela antimanchas con estructura de madera de pino, patas de roble y cojines desenfundables.'),
            ('MES-CEN', 'Mesa de Centro Madera Nogal', 249.99, 25, 'Mesa de centro con tablero de madera maciza de nogal y patas de metal negro. Diseño escandinavo minimalista.'),
            ('LAM-PIE', 'Lámpara de Pie LED Regulable', 129.99, 40, 'Lámpara de pie con brazo articulado, luz LED regulable 3 tonos y control táctil. Altura 160cm.'),
            ('COC-SET', 'Set Batería de Cocina 12 Piezas', 189.99, 30, 'Set de ollas y sartenes antiadherentes de titanio reforzado, aptas para inducción y horno hasta 220°C.'),
            ('ROB-ASP', 'Aspiradora Robot con Mapeado', 429.99, 20, 'Robot aspirador con mapeado láser LiDAR, control por app, vaciado automático y modo fregado.'),
            ('CAF-AUT', 'Cafetera Automática de Granos', 299.99, 28, 'Cafetera superautomática con molinillo integrado, vaporizador de leche y pantalla táctil. Hasta 20 recetas.'),
            ('COL-MEM', 'Colchón Memory Foam Ortopédico', 649.99, 18, 'Colchón con 5 capas de espuma viscoelástica y gel refrigerante. Firmeza media, certificado CertiPUR-US.'),
            ('SAB-LUX', 'Juego de Sábanas 1000 Hilos', 99.99, 60, 'Sábanas de algodón egipcio 1000 hilos, suaves como la seda. Incluye sábana encimera, bajera y 2 fundas.'),
            ('COR-BLK', 'Cortinas Blackout Terciopelo', 79.99, 50, 'Cortinas de terciopelo con bloqueo total de luz y aislamiento térmico. Ancho 140cm, largo 250cm (par).'),
            ('JAR-KIT', 'Kit de Jardín Profesional 8 Piezas', 69.99, 40, 'Set con pala, rastrillo, podadora, guantes y más. Mangos ergonómicos de madera de haya. Incluye bolsa de transporte.'),
        ],
    },
    {
        'name': 'Deportes y Fitness', 'slug': 'deportes',
        'products': [
            ('BIC-MTB', 'Bicicleta de Montaña 29"', 699.99, 18, 'MTB con cuadro de aluminio 6061, horquilla suspensión 100mm, frenos disco hidráulico y 21 velocidades Shimano.'),
            ('TRO-ELE', 'Trotadora Eléctrica Plegable', 899.99, 12, 'Cinta de correr con motor de 3HP, velocidad hasta 18km/h, pantalla LED, Bluetooth y sistema de amortiguación.'),
            ('MAN-ADJ', 'Mancuernas Ajustables 32kg', 199.99, 30, 'Par de mancuernas ajustables de 2 a 32kg con sistema de selector de peso rápido. Reemplazan 15 pares de mancuernas.'),
            ('YOG-MAT', 'Esterilla de Yoga Antideslizante', 49.99, 80, 'Esterilla de TPE ecológica, 6mm de grosor, superficie antideslizante doble cara, con bolsa de transporte.'),
            ('BOX-GUV', 'Guantes de Boxeo Profesional', 69.99, 55, 'Guantes de cuero genuino con relleno de espuma en capas. Disponibles en 10, 12 y 14 oz.'),
            ('RPA-SET', 'Set Ropa Deportiva Compresión', 89.99, 65, 'Conjunto de camiseta y pantalón de compresión con tejido técnico transpirable y protección UV50+.'),
            ('PRO-WHY', 'Proteína Whey Isolate 2kg', 79.99, 45, 'Proteína de suero aislada con 27g de proteína por porción, sin lactosa, sabor chocolate con 30 porciones.'),
            ('CAS-CIC', 'Casco de Ciclismo MIPS', 99.99, 40, 'Casco con sistema MIPS para máxima protección, 18 ventilaciones y ajuste dial. Certificado CE EN 1078.'),
            ('KET-BEL', 'Kettlebell Hierro Fundido 16kg', 89.99, 35, 'Kettlebell de hierro fundido con recubrimiento de vinilo, base plana y agarre ergonómico.'),
            ('BAN-RES', 'Set Bandas Elásticas Resistencia', 39.99, 100, 'Set de 5 bandas de resistencia progresiva (5-40kg), con manillas, anclaje de puerta y bolsa de viaje.'),
        ],
    },
    {
        'name': 'Libros y Educación', 'slug': 'libros',
        'products': [
            ('LIB-POD', 'El Poder del Ahora - Eckhart Tolle', 19.99, 100, 'Guía espiritual que enseña cómo vivir en el momento presente para encontrar paz y felicidad. Bestseller mundial.'),
            ('LIB-ATO', 'Atomic Habits - James Clear', 24.99, 90, 'El método probado para adquirir buenos hábitos y eliminar los malos. Más de 8 millones de copias vendidas.'),
            ('LIB-PYT', 'Python para Principiantes', 44.99, 60, 'Aprende Python desde cero con proyectos prácticos. Incluye acceso a plataforma de ejercicios online.'),
            ('LIB-CLE', 'Clean Code - Robert C. Martin', 54.99, 55, 'Manual definitivo para escribir código limpio, legible y mantenible. Lectura obligatoria para todo desarrollador.'),
            ('LIB-PRI', 'El Principito - Antoine de Saint-Exupéry', 14.99, 150, 'La obra más leída y traducida de la literatura francesa. Edición de lujo con ilustraciones originales.'),
            ('LIB-DON', 'Don Quijote de la Mancha', 29.99, 80, 'Edición conmemorativa de la obra cumbre de la literatura en lengua española. Prólogo de Rafael Cadenas.'),
            ('LIB-CIE', 'Cien Años de Soledad', 22.99, 95, 'La magistral novela de Gabriel García Márquez. Edición RAE con ilustraciones de Fernando Botero.'),
            ('LIB-ALQ', 'El Alquimista - Paulo Coelho', 17.99, 110, 'La novela más vendida de Paulo Coelho. Una historia de leyendas personales y la búsqueda del tesoro.'),
            ('LIB-IAR', 'Inteligencia Artificial: Una Guía', 59.99, 40, 'Introducción completa a la IA moderna: machine learning, redes neuronales y LLMs. Con ejercicios prácticos.'),
            ('LIB-DIS', 'Diseño UX/UI: Manual Práctico', 49.99, 45, 'Todo sobre diseño de interfaces centrado en el usuario. Figma, sistemas de diseño y accesibilidad web.'),
        ],
    },
    {
        'name': 'Juguetes y Juegos', 'slug': 'juguetes',
        'products': [
            ('LEG-CTY', 'LEGO City Centro Urbano 560 pzs', 89.99, 40, 'Set LEGO con estación de policía, parque y tiendas. Incluye 6 minifiguras. Para niños de 6 años en adelante.'),
            ('MUN-BAR', 'Muñeca Barbie Fashionista', 34.99, 60, 'Barbie articulada con 22 puntos de movimiento, incluye 3 outfits, accesorios y percha. Edición especial.'),
            ('CRR-REM', 'Auto Control Remoto 4WD', 69.99, 35, 'Auto de carreras 4WD con control a 2.4GHz, velocidad hasta 30km/h, suspensión independiente y luces LED.'),
            ('PUZ-100', 'Puzzle 1000 Piezas Paisaje', 29.99, 70, 'Rompecabezas de alta calidad con imagen de paisaje europeo. Piezas de cartón grueso encastrables.'),
            ('JUE-MON', 'Monopolio Edición Clásica', 44.99, 55, 'El juego de mesa más famoso del mundo. Para 2-8 jugadores, mayores de 8 años. Incluye billetes y propiedades.'),
            ('TRI-NIÑ', 'Triciclo a Pedales con Canasto', 99.99, 25, 'Triciclo de aluminio con asiento ajustable, canasto frontal y timbre. Para niños de 2 a 5 años.'),
            ('MAG-CON', 'Set Construcción Magnética 64 pzs', 79.99, 30, 'Bloques magnéticos de colores para construir figuras 2D y 3D. Desarrolla creatividad y habilidades STEM.'),
            ('DRO-NIÑ', 'Dron para Niños con Cámara HD', 119.99, 22, 'Dron fácil de volar con cámara 720p, modo headless, retorno automático y batería para 15 min de vuelo.'),
            ('KIT-ART', 'Kit de Pintura Acrílica 48 Colores', 44.99, 50, 'Set completo con 48 pinturas acrílicas, 12 pinceles, paleta y caballete de mesa. Para todas las edades.'),
            ('PIZ-MAG', 'Pizarra Magnética Doble Cara', 34.99, 65, 'Pizarra con lado tiza y lado borrable magnético, soporte de madera, incluye 36 imanes y marcadores.'),
        ],
    },
    {
        'name': 'Belleza y Salud', 'slug': 'belleza',
        'products': [
            ('SKN-SET', 'Set Skincare Vitamina C Completo', 89.99, 45, 'Rutina completa: limpiador, tónico, sérum vitamina C, hidratante y SPF 50. Para piel radiante en 4 semanas.'),
            ('PER-CH5', 'Perfume Floral Eau de Parfum 100ml', 129.99, 35, 'Fragancia floral con notas de jazmín, rosa y sándalo. Frasco de cristal con atomizador de precisión.'),
            ('SEC-DYS', 'Secador de Pelo Iónico 2200W', 199.99, 28, 'Secador profesional con motor DC de alta velocidad, 3 temperaturas, 2 velocidades y boquilla concentradora.'),
            ('AFE-ELE', 'Afeitadora Eléctrica Rotativa', 119.99, 40, 'Afeitadora con 3 cabezales flexibles, batería de litio 60min, impermeable IPX7 y estuche de viaje.'),
            ('MAQ-KIT', 'Kit de Maquillaje Profesional', 79.99, 40, 'Set completo con paleta de 18 sombras, base, corrector, rubor, labiales y 12 pinceles de calidad profesional.'),
            ('CRE-HID', 'Crema Hidratante Ácido Hialurónico', 39.99, 80, 'Crema de día y noche con ácido hialurónico al 2%, retinol y niacinamida. Para todo tipo de piel.'),
            ('VIT-MUL', 'Multivitamínico Completo 60 días', 34.99, 70, 'Suplemento con 23 vitaminas y minerales, Omega-3, probióticos y CoQ10. Sin gluten, vegano.'),
            ('TER-DIG', 'Termómetro Digital Infrarrojo', 44.99, 60, 'Medición instantánea en 1 segundo, pantalla LCD retroiluminada, memoria de 32 lecturas y alarma de fiebre.'),
            ('TEN-DIG', 'Tensiómetro Digital de Brazo', 99.99, 38, 'Tensiómetro con detección de arritmia, pantalla XXL, memoria de 90 mediciones y manguito universal.'),
            ('MAS-ELE', 'Masajeador Percusivo Muscular', 129.99, 32, 'Pistola de masaje con 6 cabezales, 30 niveles de velocidad, batería 8 horas y pantalla OLED. Silencioso.'),
        ],
    },
    {
        'name': 'Alimentos y Bebidas', 'slug': 'alimentos',
        'products': [
            ('CAF-GOU', 'Café Gourmet Origen Único 1kg', 29.99, 80, 'Café de altura, single origin Colombia. Tostado medio, notas de chocolate negro y frutos rojos. Molido grueso.'),
            ('CHO-SUI', 'Chocolate Belga Premium 70% Cacao', 22.99, 90, 'Tableta de chocolate negro con 70% de cacao belga, sin azúcar añadida y con certificación UTZ.'),
            ('ACE-OLV', 'Aceite de Oliva Extra Virgen 750ml', 34.99, 65, 'AOVE de cosecha temprana, acidez <0.2%, primera prensa en frío. Ideal para crudos y aliños gourmet.'),
            ('MIE-ORG', 'Miel Orgánica Multifloral 500g', 18.99, 70, 'Miel pura sin procesar de colmenas orgánicas certificadas. Rica en antioxidantes y enzimas naturales.'),
            ('YER-PRE', 'Yerba Mate Premium Amanda 1kg', 14.99, 100, 'Yerba mate estacionada 24 meses con palo. Sabor intenso y persistente. Certificación de origen Uruguay.'),
            ('GRA-ART', 'Granola Artesanal con Súperfrutos', 15.99, 85, 'Mezcla de avena, quinoa, almendras, arándonos, mango y semillas de chía. Sin azúcar refinada.'),
            ('ALM-PRE', 'Almendras Tostadas Premium 500g', 24.99, 75, 'Almendras de California tostadas sin aceite ni sal añadida. Alto contenido en vitamina E y magnesio.'),
            ('TE-VRD', 'Té Verde Matcha Ceremonial 100g', 39.99, 50, 'Matcha de grado ceremonial, primera cosecha de primavera, molido en piedra. Rico en L-teanina y antioxidantes.'),
            ('QUI-ORG', 'Quinoa Orgánica Tricolor 1kg', 16.99, 90, 'Mezcla de quinoa blanca, roja y negra. Proteína completa con los 9 aminoácidos esenciales. Sin TACC.'),
            ('SNA-SAL', 'Pack Snacks Saludables x12 unidades', 44.99, 40, 'Caja con 12 snacks variados: barras de proteína, chips de vegetales, frutos secos y galletas de arroz.'),
        ],
    },
    {
        'name': 'Herramientas', 'slug': 'herramientas',
        'products': [
            ('TAL-BSC', 'Taladro Percutor Bosch 800W', 179.99, 30, 'Taladro percutor con motor de 800W, velocidad variable, mandril de 13mm y maletín incluido. Con reversa.'),
            ('SET-DES', 'Set Destornilladores Wera 39 pzs', 79.99, 45, 'Set con mangos multicomponente, puntas magnéticas de precisión y organizador magnético. Acero inoxidable.'),
            ('SIE-CIR', 'Sierra Circular Makita 1200W', 229.99, 20, 'Sierra circular con motor de 1200W, guía paralela, protector de cuchilla y bolsa recolectora de polvo.'),
            ('NIV-LAS', 'Nivel Láser Autonivelante 3D', 129.99, 28, 'Nivel con 3 líneas cruzadas verdes 360°, precisión ±0.2mm/m, trípode incluido y estuche de protección.'),
            ('COM-AIR', 'Compresor de Aire 50L 2HP', 299.99, 15, 'Compresor silencioso con depósito de 50 litros, motor 2HP, presión máx. 8 bar y kit de accesorios.'),
            ('LLV-TOR', 'Llave Torquímetro Digital', 99.99, 35, 'Llave torquímetro con indicador digital, rango 2-200 Nm, cabeza reversible 3/8" y alarma visual/sonora.'),
            ('ESC-PLG', 'Escalera Telescópica Aluminio 5m', 149.99, 20, 'Escalera extensible de aluminio hasta 5m, capacidad 150kg, sistema de bloqueo de seguridad y almohadillas.'),
            ('CAJ-HER', 'Caja de Herramientas Organizadora', 119.99, 25, 'Maletín de metal con bandeja extraíble, 5 cajones y cerradura de seguridad. 216 herramientas incluidas.'),
            ('SOL-MIG', 'Soldadora MIG/MAG Inverter 200A', 449.99, 10, 'Soldadora inverter con panel digital, regulación de voltaje y velocidad de alambre. Para aluminio y acero.'),
            ('LIJ-ORB', 'Lijadora Orbital Random 300W', 149.99, 22, 'Lijadora excéntrica con motor de 300W, sistema de aspiración, velocidad variable y plato de 125mm.'),
        ],
    },
    {
        'name': 'Automotriz', 'slug': 'automotriz',
        'products': [
            ('ASP-CAR', 'Aspiradora Portátil Carro 120W', 64.99, 50, 'Aspiradora inalámbrica con batería de litio, succión 18kPa, boquilla plana y cepillo para asientos.'),
            ('KIT-EME', 'Kit de Emergencia Vial Completo', 49.99, 55, 'Incluye triángulos, cables de arranque, guantes, linterna, primeros auxilios y chaleco reflectante.'),
            ('GPS-AUT', 'GPS Navegador 7" con Mapas', 159.99, 28, 'Navegador con pantalla táctil de 7", mapas actualizados de América, alertas de tráfico y velocímetro.'),
            ('CAM-REV', 'Cámara de Reversa HD 170°', 79.99, 40, 'Cámara con visión nocturna, ángulo 170°, líneas de guía dinámicas y resistencia al agua IPX7.'),
            ('ALF-UNI', 'Alfombrillas Universales de Goma', 44.99, 60, 'Set de 4 alfombras de goma premium, antideslizantes, impermeables y de fácil limpieza. Talla universal.'),
            ('ARO-SET', 'Set Aromatizantes Premium x6', 24.99, 90, 'Pack de 6 aromatizantes para el auto en fragancias: cedro, vainilla, lavanda, cítrico, menta y canela.'),
            ('CAR-BAT', 'Cargador Inteligente Batería 10A', 99.99, 35, 'Cargador con pantalla LCD, modo mantenimiento, desulfatación y compatible con baterías de 6V y 12V.'),
            ('INF-NEU', 'Inflador Digital de Neumáticos', 74.99, 42, 'Inflador portátil con pantalla digital, corte automático al alcanzar la presión, linterna y batería interna.'),
            ('PRO-PAR', 'Cortasol Plegable Parabrisas', 29.99, 80, 'Cortasol de doble capa con capa reflectante plateada. Plegable, fácil de guardar. Para vehículos SUV.'),
            ('LIM-AUT', 'Kit de Limpieza Auto Profesional', 59.99, 40, 'Kit con champú, cera de carnauba, pulidor, limpiador de tapizados, microfibras y esponjas. 15 productos.'),
        ],
    },
]


def slugify_filename(nombre):
    """Convierte un nombre a ASCII seguro para usar como nombre de archivo."""
    nfkd = unicodedata.normalize('NFKD', nombre)
    ascii_str = nfkd.encode('ASCII', 'ignore').decode('ASCII')
    return re.sub(r'[^\w]', '_', ascii_str)


def crear_imagen_placeholder(nombre_producto, numero, color_rgb):
    """Genera una imagen JPEG de color sólido con texto como placeholder."""
    from PIL import Image, ImageDraw
    ancho, alto = 400, 400
    img = Image.new('RGB', (ancho, alto), color=color_rgb)
    draw = ImageDraw.Draw(img)

    # Marco interior decorativo
    draw.rectangle([15, 15, ancho - 15, alto - 15], outline=(255, 255, 255), width=2)

    # Texto del nombre (centrado aproximado)
    texto = nombre_producto[:18]
    draw.text((ancho // 2 - len(texto) * 4, alto // 2 - 20), texto, fill=(255, 255, 255))
    draw.text((ancho // 2 - 15, alto // 2 + 10), f'#{numero}', fill=(220, 220, 220))

    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=85)
    buffer.seek(0)
    nombre_archivo = f"producto_{numero}_{slugify_filename(nombre_producto[:15])}.jpg"
    return ContentFile(buffer.read(), name=nombre_archivo)


class Command(BaseCommand):
    help = 'Popula la base de datos con 100+ productos de prueba. Idempotente.'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando carga de datos de prueba...')

        # ── Crear superusuario admin ──
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@tienda.com', 'admin123')
            self.stdout.write(self.style.SUCCESS('  Superusuario admin creado (pass: admin123)'))
        else:
            self.stdout.write('  Superusuario admin ya existe.')

        # ── Crear usuarios de prueba ──
        for i in range(1, 4):
            uname = f'usuario{i}'
            if not User.objects.filter(username=uname).exists():
                User.objects.create_user(uname, f'{uname}@tienda.com', 'pass1234')
                self.stdout.write(self.style.SUCCESS(f'  Usuario {uname} creado (pass: pass1234)'))

        # ── Crear categorías y productos ──
        total_productos = 0
        num_global = 1

        for cat_data in CATALOGO:
            categoria, creada = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults={'name': cat_data['name']},
            )
            if creada:
                self.stdout.write(f'  Categoría creada: {categoria.name}')

            colores = COLORES.get(cat_data['slug'], [(80, 80, 80)])

            for i, (code, name, price, stock, description) in enumerate(cat_data['products']):
                if Product.objects.filter(code=code).exists():
                    num_global += 1
                    continue

                producto = Product.objects.create(
                    category=categoria,
                    code=code,
                    name=name,
                    description=description,
                    price=price,
                    stock=stock,
                )

                # Crear 3 imágenes por producto con colores variados
                for j in range(3):
                    color = colores[j % len(colores)]
                    # Pequeña variación de color para cada imagen
                    color_var = tuple(min(255, max(0, c + random.randint(-20, 20))) for c in color)
                    imagen_content = crear_imagen_placeholder(name, num_global, color_var)
                    img_obj = ProductImage(product=producto, is_feature=(j == 0))
                    img_obj.image.save(imagen_content.name, imagen_content, save=True)

                total_productos += 1
                num_global += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nDatos de prueba cargados exitosamente.'
                f'\n  Productos creados: {total_productos}'
                f'\n  Acceso admin: http://localhost:8000/admin  (admin / admin123)'
                f'\n  API disponible en: http://localhost:8000/api/'
            )
        )
