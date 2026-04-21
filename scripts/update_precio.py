import json
import os
import argparse

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
ARTICULOS_FILE = os.path.join(DATA_DIR, 'articulos.json')


def load_articulos():
    with open(ARTICULOS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_articulos(articulos):
    with open(ARTICULOS_FILE, 'w', encoding='utf-8') as f:
        json.dump(articulos, f, indent=2, ensure_ascii=False)


def update_precio(codigo, nuevo_precio):
    articulos = load_articulos()
    actualizado = False

    for art in articulos:
        if art['codigo'] == codigo:
            old_precio = art['precio']
            art['precio'] = nuevo_precio
            save_articulos(articulos)
            print(f"✓ Actualizado: {art['nombre']}")
            print(f"  Precio anterior: ${old_precio}")
            print(f"  Precio nuevo: ${nuevo_precio}")
            actualizado = True
            break

    if not actualizado:
        print(f"✗ Artículo con código '{codigo}' no encontrado")


def list_articulos():
    articulos = load_articulos()
    print("\nLista de artículos:")
    print("-" * 50)
    for art in articulos:
        print(f"{art['codigo']:20} | {art['nombre']:25} | ${art['precio']}")
    print("-" * 50)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Actualizar precio de artículos')
    parser.add_argument('--codigo', type=str, help='Código del artículo')
    parser.add_argument('--precio', type=float, help='Nuevo precio')
    parser.add_argument('--list', action='store_true', help='Listar todos los artículos')

    args = parser.parse_args()

    if args.list:
        list_articulos()
    elif args.codigo and args.precio is not None:
        update_precio(args.codigo, args.precio)
    else:
        print("Uso:")
        print("  python update_precio.py --codigo agua --precio 5500")
        print("  python update_precio.py --list")