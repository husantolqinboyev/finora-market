import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const CategoryManagement: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  
  // Form states
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });
  
  const [editingData, setEditingData] = useState({
    name: '',
    description: ''
  });

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Kategoriyalarni olishda xatolik:', error);
      toast({
        title: "Xatolik",
        description: "Kategoriyalarni yuklashda xatolik yuz berdi",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Xatolik",
        description: "Kategoriya nomini kiriting",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          name: newCategory.name.trim(),
          description: newCategory.description.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Muvaffaqiyat!",
        description: "Kategoriya qo'shildi",
      });

      setNewCategory({ name: '', description: '' });
      setIsAddingCategory(false);
      fetchCategories();
    } catch (error) {
      console.error('Kategoriya qo\'shishda xatolik:', error);
      toast({
        title: "Xatolik",
        description: "Kategoriya qo'shilmadi",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCategory = async (categoryId: string) => {
    if (!editingData.name.trim()) {
      toast({
        title: "Xatolik",
        description: "Kategoriya nomini kiriting",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: editingData.name.trim(),
          description: editingData.description.trim() || null
        })
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyat!",
        description: "Kategoriya yangilandi",
      });

      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Kategoriyani yangilashda xatolik:', error);
      toast({
        title: "Xatolik",
        description: "Kategoriya yangilanmadi",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Kategoriyani o\'chirishni tasdiqlaysizmi?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyat!",
        description: "Kategoriya o'chirildi",
      });

      fetchCategories();
    } catch (error) {
      console.error('Kategoriyani o\'chirishda xatolik:', error);
      toast({
        title: "Xatolik",
        description: "Kategoriya o'chirilmadi",
        variant: "destructive"
      });
    }
  };

  const startEditing = (category: Category) => {
    setEditingCategory(category.id);
    setEditingData({
      name: category.name,
      description: category.description || ''
    });
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditingData({ name: '', description: '' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Kategoriyalar Boshqaruvi</CardTitle>
              <CardDescription>
                E'lon kategoriyalarini qo'shish, tahrirlash va o'chirish
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddingCategory(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Yangi Kategoriya
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add New Category */}
      {isAddingCategory && (
        <Card>
          <CardHeader>
            <CardTitle>Yangi Kategoriya Qo'shish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-category-name">Kategoriya nomi *</Label>
              <Input
                id="new-category-name"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Masalan: Kiyim-kechak"
              />
            </div>
            <div>
              <Label htmlFor="new-category-desc">Tavsif</Label>
              <Textarea
                id="new-category-desc"
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kategoriya haqida qisqacha ma'lumot"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddCategory}>
                <Save className="w-4 h-4 mr-1" />
                Saqlash
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategory({ name: '', description: '' });
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Bekor qilish
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <div className="grid gap-4">
        {categories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground">
                Hozircha kategoriyalar yo'q
              </div>
            </CardContent>
          </Card>
        ) : (
          categories.map(category => (
            <Card key={category.id}>
              <CardContent className="p-6">
                {editingCategory === category.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`edit-name-${category.id}`}>Kategoriya nomi *</Label>
                      <Input
                        id={`edit-name-${category.id}`}
                        value={editingData.name}
                        onChange={(e) => setEditingData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-desc-${category.id}`}>Tavsif</Label>
                      <Textarea
                        id={`edit-desc-${category.id}`}
                        value={editingData.description}
                        onChange={(e) => setEditingData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUpdateCategory(category.id)}
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Saqlash
                      </Button>
                      <Button
                        variant="outline"
                        onClick={cancelEditing}
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Bekor qilish
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                      {category.description && (
                        <p className="text-muted-foreground text-sm">
                          {category.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Yaratilgan: {new Date(category.created_at).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(category)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Tahrirlash
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        O'chirish
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;
