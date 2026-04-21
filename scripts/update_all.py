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


def update_all(codigo, campo, valor):
    articulos = load_articulos()
    actualizado = False

    campos_validos = ['nombre', 'codigo', 'categoria', 'precio', 'stock']

    if campo not in campos_validos:
        print(f"✗ Campo '{campo}' no válido. Campos disponibles: {campos_validos}")
        return

    for art in articulos:
        if art['codigo'] == codigo:
            old_valor = art.get(campo)
            art[campo] = valor

            save_articulos(articulos)
            print(f"✓ Actualizado: {art['nombre']}")
            print(f"  Campo: {campo}")
            print(f"  Anterior: {old_valor}")
            print(f"  Nuevo: {valor}")
            actualizado = True
            break

    if not actualizado:
        print(f"✗ Artículo con código '{codigo}' no encontrado")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Actualizar cualquier campo de un artículo')
    parser.add_argument('--codigo', type=str, required=True, help='Código del artículo')
    parser.add_argument('--campo', type=str, required=True, help='Campo a actualizar (nombre, codigo, categoria, precio, stock)')
    parser.add_argument('--valor', type=str, help='Nuevo valor')

    args = parser.parse_args()

    valor = args.valor

    if args.campo in ['precio', 'stock']:
        try:
            valor = int(valor) if args.campo == 'stock' else float(valor)
        except ValueError:
            print(f"✗ El valor debe ser numérico para el campo '{args.campo}'")
            exit(1)

    update_all(args.codigo, args.campo, valor)