#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
from pathlib import Path

f = json.load(open('productos_mejorados.json', 'r', encoding='utf-8'))
print(f'Total productos: {len(f)}')
print(f'Primeros IDs: {[p["id"] for p in f[:5]]}')
print(f'Últimos IDs: {[p["id"] for p in f[-5:]]}')
if f:
    print(f'Rango: {f[0]["id"]} a {f[-1]["id"]}')
