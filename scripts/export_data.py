import json
import os
import csv
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'exports')


def load_json(filename):
    filepath = os.path.join(DATA_DIR, filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


def save_json(filename, data):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def export_json(archivo):
    data = load_json(archivo)
    if data is None:
        print(f"✗ Archivo no encontrado: {archivo}")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output = os.path.join(OUTPUT_DIR, archivo)
    save_json(archivo, data)
    print(f"✓ Exportado: {output}")


def export_csv():
    ventas = load_json('ventas.json')
    if not ventas:
        print("No hay ventas para exportar")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output = os.path.join(OUTPUT_DIR, f"ventas_{datetime.now().strftime('%Y%m%d')}.csv")

    with open(output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['ID', 'Fecha', 'Cliente', 'Monto', 'Medio de Pago'])

        for v in ventas:
            writer.writerow([
                v.get('idVenta', ''),
                v.get('fecha', ''),
                v.get('cliente', ''),
                v.get('monto', 0),
                v.get('medioPago', '')
            ])

    print(f"✓ Exportado: {output}")


def export_all():
    archivos = ['articulos.json', 'clientes.json', 'ventas.json', 'medios_pago.json', 'datos_negocio.json']

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Exportando a: {OUTPUT_DIR}\n")

    for archivo in archivos:
        data = load_json(archivo)
        if data is not None:
            output = os.path.join(OUTPUT_DIR, archivo)
            save_json(archivo, data)
            print(f"✓ {archivo}")
        else:
            print(f"✗ {archivo} (no encontrado)")

    print(f"\n✓ Todos los archivos exportados a {OUTPUT_DIR}")


def status():
    print("=" * 50)
    print("ESTADO DEL SISTEMA")
    print("=" * 50)

    archivos = {
        'articulos.json': 'Artículos',
        'clientes.json': 'Clientes',
        'ventas.json': 'Ventas',
        'medios_pago.json': 'Medios de Pago',
        'datos_negocio.json': 'Datos del Negocio'
    }

    for archivo, nombre in archivos.items():
        data = load_json(archivo)
        if data is not None:
            if isinstance(data, list):
                print(f"✓ {nombre}: {len(data)} registros")
            else:
                print(f"✓ {nombre}: configurado")
        else:
            print(f"✗ {nombre}: sin datos")

    print("=" * 50)


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Exportar datos del POS')
    parser.add_argument('--json', type=str, help='Exportar un archivo JSON específico')
    parser.add_argument('--ventas-csv', action='store_true', help='Exportar ventas a CSV')
    parser.add_argument('--all', action='store_true', help='Exportar todos los JSONs')
    parser.add_argument('--status', action='store_true', help='Mostrar estado del sistema')

    args = parser.parse_args()

    if args.status:
        status()
    elif args.all:
        export_all()
    elif args.ventas_csv:
        export_csv()
    elif args.json:
        export_json(args.json)
    else:
        print("Uso:")
        print("  python export_data.py --status")
        print("  python export_data.py --all")
        print("  python export_data.py --ventas-csv")
        print("  python export_data.py --json articulos.json")