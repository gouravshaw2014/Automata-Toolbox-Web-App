from flask import Flask, request, jsonify
from flask_cors import CORS
from automata_processor import AutomataProcessor

app = Flask(__name__)
CORS(app)

@app.route('/api/process-automata', methods=['POST'])
def process_automata():
    data = request.json
    # print(data)
    try:
        results = AutomataProcessor.process(
            data['automata_type'],
            data['config'],
            data['test_cases']
        )
        
        if data['automata_type'] == 'NFA':
            results = [{'input': tc, 'accepted': acc} for tc, acc in zip(data['test_cases'], results)]
        else:
            tuple_test_cases = [
                [(step[0], step[1]) for step in test_case]
                for test_case in data['test_cases']
            ]
            results = [{'input': tc, 'accepted': acc} for tc, acc in zip(tuple_test_cases, results)]

        return jsonify({
            'success': True,
            'results': results
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })


@app.route('/api/check-emptiness', methods=['POST'])
def check_emptiness():
    data = request.json
    try:
        results = AutomataProcessor.check_empty(
            data['automata_type'],
            data['config']
        )
        
        # if data['automata_type'] == 'NFA':
        #     results = [{'input': tc, 'accepted': acc} for tc, acc in zip(data['test_cases'], results)]
        # else:
        #     tuple_test_cases = [
        #         [(step[0], step[1]) for step in test_case]
        #         for test_case in data['test_cases']
        #     ]
        #     results = [{'input': tc, 'accepted': acc} for tc, acc in zip(tuple_test_cases, results)]

        return jsonify({
            'success': True,
            'results': results
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })



if __name__ == '__main__':
    app.run(debug=True)

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5000, debug=True)