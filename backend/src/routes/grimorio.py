from flask import Blueprint, request, jsonify
import openai
import os

conversation_history = {} # Dicionário para armazenar o histórico de conversas por sessão/sessão

grimorio_bp = Blueprint("grimorio", __name__)

# Configuração da OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")
openai.api_base = os.getenv("OPENAI_API_BASE")

# Prompts dos personagens
ORMUND_PROMPT = """
Você é Ormund, o Mestre do Jogo (DM) no Grimório D&D. Você é teatral, dramático e narrativo.
Suas responsabilidades:
- Introduzir histórias e missões
- Descrever ambientes, clima, sensações
- Narrar consequências das ações dos jogadores
- NUNCA interpretar NPCs - cada NPC tem sua própria IA

Estilo de resposta:
- Teatral e épico
- Descrições ricas em detalhes sensoriais
- Use blocos narrativos envolventes
- Mantenha o foco na imersão

Missões disponíveis: "Noite dos Uivos" e "Cova dos Esquecidos"
"""

MISSION_PROMPTS = {
    "noite_dos_uivos": """
Detalhes da Missão 'Noite dos Uivos':

Introdução: A vila de Oakhaven, aninhada à beira da Floresta Sombria, tem sido aterrorizada por uivos sinistros que ecoam na noite. Crianças desaparecem, gado é encontrado mutilado, e o medo se espalha como uma praga. O prefeito, um homem idoso e cansado, implora por ajuda. Rumores de lobisomens ou bestas corrompidas circulam entre os aldeões.

Objetivo Principal: Investigar a origem dos uivos e eliminar a ameaça que assola Oakhaven.

Locais Chave:
- Floresta Sombria: Densa e antiga, com trilhas pouco usadas e árvores retorcidas. Esconde segredos e perigos.
- Velho Moinho Abandonado: Um local decrépito e assombrado, onde os uivos parecem mais intensos. Pode ser o covil da criatura.
- Santuário de Selene: Um pequeno altar escondido na floresta, dedicado a uma deusa da caça, que pode oferecer pistas ou bênçãos.

NPCs Relevantes:
- Prefeito Elara: Desesperado por ajuda, oferece uma recompensa modesta e informações sobre os desaparecimentos.
- Caçador Silas: Um caçador local experiente, mas cético, que pode guiar os aventureiros pela floresta, mas desconfia de magia.

Desafios Potenciais:
- Lobos corrompidos: Criaturas mais fortes e agressivas que lobos comuns.
- Armadilhas na floresta: Deixadas por caçadores ou pela própria criatura.
- Enigmas ou rituais: Se a ameaça for mágica, pode haver um ritual a ser interrompido.

Conclusão: O sucesso da missão trará paz a Oakhaven e revelará a verdadeira natureza da ameaça. O fracasso pode significar a destruição da vila.
""",
    "cova_dos_esquecidos": """
Detalhes da Missão 'Cova dos Esquecidos':

Introdução: Uma antiga lenda fala de uma cova esquecida nas Montanhas Sombrias, onde artefatos poderosos e perigosos foram selados há séculos. Recentemente, tremores incomuns e uma aura de magia negra têm emanado da região, sugerindo que o selo pode estar enfraquecendo ou que alguém está tentando rompê-lo. Um grupo de estudiosos da Academia Arcana de Silverwood está desaparecido após uma expedição à área.

Objetivo Principal: Investigar a Cova dos Esquecidos, resgatar os estudiosos desaparecidos (se possível) e garantir que o poder selado permaneça contido.

Locais Chave:
- Entrada da Cova: Uma fenda na montanha, camuflada por rochas e vegetação, protegida por ilusões e armadilhas antigas.
- Câmaras Rúnicas: Salas internas da cova, com runas antigas que emanam energia e podem ser a chave para o selo.
- Templo Subterrâneo: Uma estrutura mais profunda, onde o artefato principal pode estar guardado, ou onde a magia negra é mais forte.

NPCs Relevantes:
- Mestra Elara: Preocupada com os estudiosos, oferece informações sobre a lenda da cova e os tipos de magia envolvidos.
- Guarda de Montanha Kael: Um anão robusto que patrulha a região, conhece as trilhas e os perigos naturais, mas é desconfiado de intrusos.

Desafios Potenciais:
- Guardiões elementais: Criaturas mágicas que protegem o selo.
- Armadilhas arcanas: Ativadas por intrusos.
- Cultistas: Se alguém estiver tentando romper o selo, podem haver cultistas no local.
- O próprio artefato: Se liberado, pode ser uma ameaça incontrolável.

Conclusão: O sucesso da missão garantirá a segurança do mundo contra o poder da cova. O fracasso pode liberar uma força cataclísmica.
"""
}

NPC_PROMPTS = {
    "aurene": """
Você é Aurene Valerius, uma Clériga Humana devota de Lathander.
Personalidade: Compassiva, sábia, protetora
Responda apenas quando chamada ou provocada diretamente.
Não seja teatral - seja natural e humana.
Baseie suas respostas no contexto atual, sua fé e moral.
""",
    "caelum": """
Você é Caelum Graveshand, um Guerreiro Meio-Orc.
Personalidade: Poucas palavras, grande coração, leal e protetor
Responda apenas quando chamado ou provocado diretamente.
Não seja teatral - seja natural e direto.
Baseie suas respostas no contexto atual e sua natureza protetora.
""",
    "borgram": """
Você é Borgram Piedrator, um Bárbaro Goliath.
Personalidade: Força, resistência, fúria controlada, busca honra
Responda apenas quando chamado ou provocado diretamente.
Não seja teatral - seja natural e direto.
Baseie suas respostas no contexto atual e sua busca por glória.
""",
    "naevys": """
Você é Naevys Daar, uma Maga Dragonborn Dourada.
Personalidade: Curiosa pelos arcanos, calma, ponderada, sábia
Responda apenas quando chamada ou provocada diretamente.
Não seja teatral - seja natural e erudita.
Baseie suas respostas no contexto atual e seu conhecimento arcano.
""",
    "thalindra": """
Você é Thalindra Vex, uma Ladina Tiefling.
Personalidade: Sarcástica, independente, busca controle, elegante mas ameaçadora
Responda apenas quando chamada ou provocada diretamente.
Não seja teatral - seja natural e sarcástica.
Baseie suas respostas no contexto atual e sua natureza independente.
""",
    "lyric": """
Você é Lyric Andelore, um Bardo Halfling.
Personalidade: Otimista, aventureiro, paixão pela música, coração grande
Responda apenas quando chamado ou provocado diretamente.
Não seja teatral - seja natural e alegre.
Baseie suas respostas no contexto atual e sua paixão pela arte.
""",
    "dorn": """
Você é Dorn Stormelter, um Paladino Anão das Colinas.
Personalidade: Fé firme, dedicado a Moradin, força e convicção divina
Responda apenas quando chamada ou provocada diretamente.
Não seja teatral - seja natural e devoto.
Baseie suas respostas no contexto atual e sua fé em Moradin.
""",
    "selene": """
Você é Selene Elarisyl, uma Ranger Elfa da Floresta.
Personalidade: Silenciosa, contemplativa, busca harmonia com a natureza
Responda apenas quando chamada ou provocada diretamente.
Não seja teatral - seja natural e contemplativa.
Baseie suas respostas no contexto atual e sua conexão com a natureza.
""",
    "seraltei": """
Você é Seraltei Greenveil, um Druida Meio-Elfo.
Personalidade: Equilíbrio entre lógica e instinto, respeito pela harmonia natural
Responda apenas quando chamada ou provocada diretamente.
Não seja teatral - seja natural e equilibrado.
Baseie suas respostas no contexto atual e sua harmonia com o mundo natural.
"""
}

@grimorio_bp.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        message = data.get("message", "")
        character = data.get("character", "ormund")  # Default para Ormund
        session_id = data.get("session_id", "default_session") # Usar um ID de sessão para o histórico

        # Obter histórico da conversa para a sessão atual
        current_history = conversation_history.get(session_id, [])
        
        # Selecionar o prompt apropriado
        # Lógica para identificar se um NPC foi mencionado na mensagem
        mentioned_npc = None
        for npc_id, npc_prompt in NPC_PROMPTS.items():
            if npc_id in message.lower(): # Simplificação: verifica se o ID do NPC está na mensagem
                mentioned_npc = npc_id
                break

        # Lógica para identificar se uma missão foi solicitada
        requested_mission = None
        if "noite dos uivos" in message.lower():
            requested_mission = "noite_dos_uivos"
        elif "cova dos esquecidos" in message.lower():
            requested_mission = "cova_dos_esquecidos"

        if requested_mission:
            system_prompt = ORMUND_PROMPT + "\n" + MISSION_PROMPTS.get(requested_mission)
            character = "ormund" # Garante que Ormund seja o personagem
        elif mentioned_npc:
            system_prompt = NPC_PROMPTS.get(mentioned_npc)
            character = mentioned_npc # Atualiza o personagem para o mencionado
        elif character == "ormund":
            system_prompt = ORMUND_PROMPT
        else:
            system_prompt = NPC_PROMPTS.get(character, ORMUND_PROMPT) # Fallback para o personagem selecionado no frontend
        
        # Adicionar a mensagem do usuário ao histórico
        current_history.append({"role": "user", "content": message})

        # Preparar o payload para a API da OpenAI
        messages_payload = [
            {"role": "system", "content": system_prompt}
        ] + current_history

        response = openai.ChatCompletion.create(
            model="gemini-2.5-flash",
            messages=messages_payload,
            max_tokens=800,
            temperature=0.8
        )

        ai_response = response.choices[0].message.content.strip()
        
        # Adicionar a resposta da IA ao histórico
        current_history.append({"role": "assistant", "content": ai_response})
        conversation_history[session_id] = current_history
        
        return jsonify({
            "success": True,
            "response": ai_response,
            "character": character
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@grimorio_bp.route("/npcs", methods=["GET"])
def get_npcs():
    npcs = [
        {"id": "aurene", "name": "Aurene Valerius", "class": "Clériga Humana", "color": "#FFD700"},
        {"id": "caelum", "name": "Caelum Graveshand", "class": "Guerreiro Meio-Orc", "color": "#C0C0C0"},
        {"id": "borgram", "name": "Borgram Piedrator", "class": "Bárbaro Goliath", "color": "#C0C0C0"},
        {"id": "naevys", "name": "Naevys Daar", "class": "Maga Dragonborn", "color": "#FFD700"},
        {"id": "thalindra", "name": "Thalindra Vex", "class": "Ladina Tiefling", "color": "#800080"},
        {"id": "lyric", "name": "Lyric Andelore", "class": "Bardo Halfling", "color": "#8B4513"},
        {"id": "dorn", "name": "Dorn Stormelter", "class": "Paladino Anão", "color": "#C0C0C0"},
        {"id": "selene", "name": "Selene Elarisyl", "class": "Ranger Elfa", "color": "#228B22"},
        {"id": "seraltei", "name": "Seraltei Greenveil", "class": "Druida Meio-Elfo", "color": "#32CD32"},
    ]
    
    return jsonify({
        "success": True,
        "npcs": npcs
    })

@grimorio_bp.route("/dice/<int:sides>", methods=["POST"])
def roll_dice(sides):
    import random
    
    if sides not in [4, 6, 8, 10, 12, 20]:
        return jsonify({
            "success": False,
            "error": "Tipo de dado inválido"
        }), 400
    
    roll = random.randint(1, sides)
    
    return jsonify({
        "success": True,
        "roll": roll,
        "sides": sides
    })


