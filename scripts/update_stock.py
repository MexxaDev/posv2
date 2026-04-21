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


def update_stock(codigo, nuevo_stock=None, variar=None):
    articulos = load_articulos()
    actualizado = False

    for art in articulos:
        if art['codigo'] == codigo:
            old_stock = art.get('stock', 0)

            if nuevo_stock is not None:
                art['stock'] = nuevo_stock
            elif variar is not None:
                art['stock'] = max(0, old_stock + variar)

            save_articulos(articulos)
            print(f"✓ Actualizado: {art['nombre']}")
            print(f"  Stock anterior: {old_stock}")
            print(f"  Stock nuevo: {art['stock']}")
            actualizado = True
            break

    if not actualizado:
        print(f"✗ Artículo con código '{codigo}' no encontrado")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Actualizar stock de artículos')
    parser.add_argument('--codigo', type=str, required=True, help='Código del artículo')
    parser.add_argument('--stock', type=int, help='Nuevo stock (valor absoluto)')
    parser.add_argument('--variar', type=int, help='Variar stock (positivo suma, negativo resta)')

    args = parser.parse_args()

    if args.stock is not None:
        update_stock(args.codigo, nuevo_stock=args.stock)
    elif args.variar is not None:
        update_stock(args.codigo, variar=args.variar)
    else:
        print("Uso:")
        print("  python update_stock.py --codigo agua --stock 50")
        print("  python update_stock.py --codigo agua --variar 10")