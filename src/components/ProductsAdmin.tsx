import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2, Save, ExternalLink } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';
import { toast } from 'sonner';

export function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ name: '', type: 'subscription', price: 0, description: '', isActive: true });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      setProducts(snap.docs.map(doc => doc.data() as Product));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'products');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreateProduct = async () => {
    if (!newProduct.name || newProduct.price === undefined) {
      toast.error('NAME AND PRICE REQUIRED');
      return;
    }
    const id = Math.random().toString(36).substr(2, 9);
    try {
      await setDoc(doc(db, 'products', id), {
        ...newProduct,
        id,
        features: ["Access to community", "Weekly calls"], // Default mockup features
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setNewProduct({ name: '', type: 'subscription', price: 0, description: '', isActive: true });
      toast.success('PRODUCT ADDED TO REGISTRY');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `products/${id}`);
      toast.error('CREATION FAILED');
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    try {
      await setDoc(doc(db, 'products', product.id), {
        ...product,
        updatedAt: new Date().toISOString()
      });
      toast.success('PRODUCT PROTOCOL UPDATED');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${product.id}`);
      toast.error('UPDATE FAILED');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('PRODUCT ARCHIVED');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      toast.error('ARCHIVAL FAILED');
    }
  };

  return (
    <Card className="bg-card border-primary/20 rounded-none overflow-hidden">
      <CardHeader className="border-b border-primary/20 bg-primary/5">
        <CardTitle className="text-lg font-heading text-primary tracking-wide">Product Registry</CardTitle>
        <CardDescription className="text-[10px] text-primary/60 font-mono uppercase">Manage plans and one-time purchases</CardDescription>
      </CardHeader>
      <CardContent className="p-0 font-mono">
        <div className="p-6 border-b border-primary/10 bg-primary/2">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input className="bg-background border-primary/20 rounded-none h-10 text-xs focus:border-primary transition-all md:col-span-2" placeholder="Product Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
            
            <Select value={newProduct.type} onValueChange={(val: 'subscription' | 'one_time') => setNewProduct({...newProduct, type: val})}>
              <SelectTrigger className="h-10 text-[10px] bg-background border-primary/20 rounded-none font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-primary/20 rounded-none font-mono">
                <SelectItem value="subscription" className="text-[10px] uppercase">Subscription (Plan)</SelectItem>
                <SelectItem value="one_time" className="text-[10px] uppercase">One Time (Hour/Lecture)</SelectItem>
              </SelectContent>
            </Select>

            <Input className="bg-background border-primary/20 rounded-none h-10 text-xs focus:border-primary transition-all" type="number" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
            
            <Button onClick={handleCreateProduct} className="bg-primary text-black hover:bg-primary/80 rounded-none h-10 text-[10px] font-bold uppercase tracking-widest">
              <Plus className="w-4 h-4 mr-2" /> Add 
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow className="border-primary/10 hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-primary/70">ID</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-primary/70">Name</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-primary/70">Type</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-primary/70">Price</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-primary/70">Status</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest font-bold text-right text-primary/70">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {loading ? (
                <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-primary/40 text-xs">Syncing products...</TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-primary/40 text-xs">No products defined yet.</TableCell>
                </TableRow>
              ) : products.map(product => (
                 <TableRow key={product.id} className="border-primary/10 hover:bg-primary/5 transition-colors">
                    <TableCell className="font-mono text-[10px] text-primary/80">{product.id.substring(0, 6)}</TableCell>
                    <TableCell>
                      <Input className="bg-transparent border-transparent hover:border-primary/20 focus:bg-background h-8 text-[11px] rounded-none transition-all" value={product.name} onChange={e => {
                        const updated = products.map(p => p.id === product.id ? {...p, name: e.target.value} : p);
                        setProducts(updated);
                      }} />
                    </TableCell>
                    <TableCell className="text-[10px] uppercase tracking-wider">{product.type}</TableCell>
                    <TableCell>
                      <Input type="number" className="bg-transparent border-transparent hover:border-primary/20 focus:bg-background h-8 text-[11px] rounded-none transition-all" value={product.price} onChange={e => {
                        const updated = products.map(p => p.id === product.id ? {...p, price: parseFloat(e.target.value)} : p);
                        setProducts(updated);
                      }} />
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={product.isActive} 
                        onCheckedChange={(val) => {
                          const updated = products.map(p => p.id === product.id ? {...p, isActive: val} : p);
                          setProducts(updated);
                        }} 
                        className="data-[state=checked]:bg-green-500 scale-75 origin-left"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary/40 hover:text-primary hover:bg-primary/10 rounded-none" onClick={() => handleUpdateProduct(product)}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary/40 hover:text-destructive hover:bg-destructive/10 rounded-none" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                    </TableCell>
                 </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
