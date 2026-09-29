import { NextRequest, NextResponse } from 'next/server';
import { getAllPeople, savePerson, deletePersonWithData } from '@/lib/db';

export async function GET() {
  try {
    const people = await getAllPeople();
    return NextResponse.json(people);
  } catch (error) {
    console.error('Error fetching people:', error);
    return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, relationship, designation, profileImage, events, notes, songs, socialLinks } = body;

    if (!personData.name || !personData.relationship) {
      return NextResponse.json({ error: 'Name and relationship are required' }, { status: 400 });
    }

    const person = await savePerson(personData);
    return NextResponse.json(personData, { status: 201 });
  } catch (error) {
    console.error('Error creating person:', error);
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 });
  }
}