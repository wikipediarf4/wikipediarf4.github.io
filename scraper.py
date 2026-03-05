if rows:
        row = rows[0]
        print("CLASES DE FILA:", row.get_attribute('class'))
        cols_test = row.find_elements(By.CSS_SELECTOR, '*')
        print("PRIMER ELEMENTO:", cols_test[0].get_attribute('class') if cols_test else "nada")
        print("HTML FILA:", row.get_attribute('innerHTML')[:500])
