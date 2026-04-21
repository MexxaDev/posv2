import json
import csv
import os
import argparse

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
ARTICULOS_FILE = os.path.join(DATA_DIR, 'articulos.json')


def load_articulos():
    if os.path.exists(ARTICULOS_FILE):
        with open(ARTICULOS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []


def save_articulos(articulos):
    with open(ARTICULOS_FILE, 'w', encoding='utf-8') as f:
        json.dump(articulos, f, indent=2, ensure_ascii=False)


def generate_id(prefix='art'):
    import time
    import random
    return f"{prefix}_{int(time.time())}_{random.randint(1000, 9999)}"


def import_csv(csv_file):
    articulos = load_articulos()
    existentes = {art['codigo']: art for art in articulos}
    importados = 0
    errores = 0

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            try:
                codigo = row.get('codigo', '').strip().lower()
                nombre = row.get('nombre', '').strip()
                categoria = row.get('categoria', 'general').strip().lower()
                precio = float(row.get('precio', 0))
                stock = int(row.get('stock', 0))

                if not codigo or not nombre:
                    print(f"✗ Fila ignorada (falta código o nombre): {row}")
                    errores += 1
                    continue

                if codigo in existentes:
                    existentes[codigo].update({
                        'nombre': nombre,
                        'categoria': categoria,
                        'precio': precio,
                        'stock': stock
                    })
                    print(f"↻ Actualizado: {nombre}")
                else:
                    nuevo = {
                        'id': generate_id(),
                        'codigo': codigo,
                        'nombre': nombre,
                        'categoria': categoria,
                        'precio': precio,
                        'stock': stock
                    }
                    articulos.append(nuevo)
                    existentes[codigo] = nuevo
                    print(f"+ Nuevo: {nombre}")
                    importados += 1

            except Exception as e:
                print(f"✗ Error procesando fila: {row} - {e}")
                errores += 1

    save_articulos(articulos)
    print(f"\n✓ Importación completada")
    print(f"  Nuevos: {importados}")
    print(f"  Actualizados: {len(existentes) - importados}")
    print(f"  Errores: {errores}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Importar productos desde CSV')
    parser.add_argument('archivo', type=str, help='Ruta al archivo CSV')
    parser.add_argument('--preview', action='store_true', help='Mostrar estructura del CSV')

    args = parser.parse_args()

    if not os.path.exists(args.archivo):
        print(f"✗ Archivo no encontrado: {args.archivo}")
        exit(1)

    if args.preview:
        print("El CSV debe tener las siguientes columnas:")
        print("  codigo, nombre, categoria, precio, stock")
    else:
        import_csv(args.archivo)
        print("\nNota: Crea un CSV con encabezados: codigo,nombre,categoria,precio,stock")