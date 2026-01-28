# Pattern Result : Ok vs Err vs throw

## Principe fondamental

> **"Ok vs Err, c'est une question de contrat"**

- **Échec prévu par le métier** → `Result<T, E>`
- **Échec inattendu (crash technique)** → `throw`

---

## Règle de décision en 3 questions

### 1️⃣ L'échec est-il prévu par le métier ?
- **Oui** → `Result<T, E>`
- **Non** → `throw`

### 2️⃣ L'opération doit toujours produire un résultat ?
- **Oui** → `Ok(...)` même si vide (`[]`, `{}`)
- **Non** → `Err(...)`

### 3️⃣ Le caller doit décider quoi faire en cas d'échec ?
- **Oui** → `Result<T, E>`
- **Non** → `throw`

---

## Guide de référence

### ✅ `Ok(value)`
**Quand :** Succès, même si résultat vide

```typescript
// Liste vide = Ok (cas normal)
async findAll(): Promise<Product[]> {
  return []; // Pas besoin de Result
}

// Entité trouvée
async findOne(id: number): Promise<Result<User, string>> {
  const user = await this.prisma.user.findUnique({ where: { id } });
  return user ? Ok(user) : Err('User not found');
}
```

### ❌ `Err(error)`
**Quand :** Échec métier prévu (ID introuvable, contrainte violée, validation échouée)

```typescript
// ID introuvable
async findOne(id: number): Promise<Result<User, string>> {
  const user = await this.prisma.user.findUnique({ where: { id } });
  if (!user) return Err(`User with ID ${id} not found`);
  return Ok(user);
}

// Contrainte unique violée
async create(dto: CreateUserDto): Promise<Result<User, string>> {
  try {
    return Ok(await this.prisma.user.create({ data: dto }));
  } catch (error) {
    if (error.code === 'P2002') return Err('Email already exists');
    throw error; // Erreur technique → throw
  }
}
```

### ⚠️ `throw`
**Quand :** Erreur technique inattendue (DB down, réseau coupé, bug interne)

```typescript
catch (error) {
  if (error.code === 'P2002') {
    return Err('Unique constraint violation'); // Métier prévu
  }
  throw error; // Technique inattendu → propagation
}
```

---

## Tableaux de référence

### CRUD Operations

| Opération | Succès | Échec métier | Erreur technique |
|-----------|--------|--------------|------------------|
| `findAll()` | `[]` ou `Ok([])` | N/A | `throw` |
| `findOne(id)` | `Ok(entity)` | `Err('not found')` | `throw` |
| `create(dto)` | `Ok(entity)` | `Err('constraint')` | `throw` |
| `update(id, dto)` | `Ok(entity)` | `Err('not found')` | `throw` |
| `remove(id)` | `Ok(entity)` | `Err('not found')` | `throw` |

### Authentification

| Opération | Succès | Échec métier | Erreur technique |
|-----------|--------|--------------|------------------|
| `validateUser()` | `Ok(user)` | `Err('invalid password')` | `throw` |
| `register()` | `Ok(token)` | `Err('email exists')` | `throw` |

---

## Gestion dans les contrôleurs

```typescript
async findOne(@Param('id', ParseIntPipe) id: number) {
  const result = await this.service.findOne(id);
  if (result.isErr()) {
    throw new NotFoundException(result.unwrapErr());
  }
  return result.unwrap();
}
```

**Mapping :**
- `Err('not found')` → `NotFoundException`
- `Err('constraint violation')` → `ConflictException`
- `Err('invalid credentials')` → `UnauthorizedException`
- Erreurs techniques → Propagation vers handler global

---

## Règle d'or

> **"Si c'est prévu, c'est Result. Si c'est inattendu, c'est throw.  
> Si c'est un cas normal mais vide, c'est Ok([])."**

---

## Checklist rapide

- [ ] Échec prévu par le métier ? → `Result`
- [ ] Résultat vide = cas normal ? → `Ok([])`
- [ ] Le caller doit gérer l'erreur ? → `Result`
- [ ] Erreur technique inattendue ? → `throw`
