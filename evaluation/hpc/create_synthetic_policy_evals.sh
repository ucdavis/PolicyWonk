#!/bin/bash
#SBATCH --partition=gpul
#SBATCH --nodelist=gpu-3-38,gpu-5-46
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --gres=gpu:1
#SBATCH --mem=128G
#SBATCH --time=1-00:00:00
#SBATCH --job-name=create-synth-policy-evals

# Load the conda module
module load conda

# Activate your pre-created conda environment (replace "myenv" with your env name)
conda activate policywonk

# Start ollama in the background
export OLLAMA_HOST=0.0.0.0 && ~/ollama/bin/ollama serve &

# (Optional) Ensure the required packages are installed.
# Uncomment the next line if you need to install from requirements.txt:
# pip install -r ~/policywonk/requirements.txt

# Change directory to your evaluation folder
cd ~/policywonk/evaluation

# Run the main script
python datasets/create_synthetic.py
