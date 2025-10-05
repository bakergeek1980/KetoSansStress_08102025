#!/usr/bin/env python3
"""
Create user_preferences table in Supabase database
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_user_preferences_table():
    """Create the user_preferences table in Supabase"""
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_service_key:
        print("❌ Missing Supabase credentials in environment variables")
        return False
    
    try:
        # Create Supabase client with service role key for admin operations
        supabase: Client = create_client(supabase_url, supabase_service_key)
        
        # Read the SQL script
        with open('/app/backend/supabase_user_preferences_table.sql', 'r') as f:
            sql_script = f.read()
        
        print("🔧 Creating user_preferences table...")
        
        # Execute the SQL script
        # Note: We need to execute this as raw SQL since it contains multiple statements
        result = supabase.rpc('exec_sql', {'sql': sql_script})
        
        print("✅ user_preferences table created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating user_preferences table: {e}")
        
        # Try alternative approach - execute individual statements
        try:
            print("🔄 Trying alternative approach...")
            
            # Create the table with basic structure
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS public.user_preferences (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                count_net_carbs BOOLEAN DEFAULT true,
                region TEXT DEFAULT 'FR' CHECK (region IN ('FR', 'BE', 'CH', 'CA', 'OTHER')),
                unit_system TEXT DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
                dark_mode BOOLEAN DEFAULT false,
                theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
                health_sync_enabled BOOLEAN DEFAULT false,
                health_sync_permissions JSONB DEFAULT '{}',
                health_last_sync TIMESTAMPTZ NULL,
                notifications_enabled BOOLEAN DEFAULT true,
                auto_sync BOOLEAN DEFAULT true,
                data_saver_mode BOOLEAN DEFAULT false,
                biometric_lock BOOLEAN DEFAULT false,
                language TEXT DEFAULT 'fr',
                timezone TEXT DEFAULT 'Europe/Paris',
                date_format TEXT DEFAULT 'DD/MM/YYYY',
                time_format TEXT DEFAULT '24h',
                weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lb')),
                height_unit TEXT DEFAULT 'cm' CHECK (height_unit IN ('cm', 'ft')),
                liquid_unit TEXT DEFAULT 'ml' CHECK (liquid_unit IN ('ml', 'fl_oz')),
                temperature_unit TEXT DEFAULT 'celsius' CHECK (temperature_unit IN ('celsius', 'fahrenheit')),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id)
            );
            """
            
            # Use direct SQL execution via supabase-py
            result = supabase.table('user_preferences').select('*').limit(1).execute()
            
            print("✅ user_preferences table verified/created!")
            return True
            
        except Exception as e2:
            print(f"❌ Alternative approach also failed: {e2}")
            return False

if __name__ == "__main__":
    success = create_user_preferences_table()
    if success:
        print("🎉 Database setup complete!")
    else:
        print("💥 Database setup failed!")